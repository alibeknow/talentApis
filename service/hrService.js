function toCandidateExtended(json) {
    return cast(JSON.parse(json), r("CandidateExtended"));
}

function candidateExtendedToJson(value) {
    return JSON.stringify(uncast(value, r("CandidateExtended")), null, 2);
}

function invalidValue(typ, val) {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        var map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        var map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val, typ, getProps) {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        var result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    return transformPrimitive(typ, val);
}

function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}

function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}

function a(typ) {
    return { arrayItems: typ };
}

function u(...typs) {
    return { unionMembers: typs };
}

function o(props, additional) {
    return { props, additional };
}

function m(additional) {
    return { props: [], additional };
}

function r(name) {
    return { ref: name };
}

const typeMap = {
    "CandidateExtended": o([
        { json: "documentId", js: "documentId", typ: r("DocumentID") },
        { json: "alternateIds", js: "alternateIds", typ: a(r("DocumentID")) },
        { json: "dataProtectionPolicy", js: "dataProtectionPolicy", typ: r("DataProtectionPolicy") },
        { json: "uri", js: "uri", typ: "" },
        { json: "person", js: "person", typ: r("Person") },
        { json: "profiles", js: "profiles", typ: a(r("Profile")) },
    ], false),
    "DocumentID": o([
        { json: "value", js: "value", typ: "" },
        { json: "schemeId", js: "schemeId", typ: "" },
    ], false),
    "DataProtectionPolicy": o([
        { json: "retentionDays", js: "retentionDays", typ: 0 },
        { json: "retentionDate", js: "retentionDate", typ: "" },
        { json: "geoRestrictions", js: "geoRestrictions", typ: a(r("GeoRestriction")) },
    ], false),
    "GeoRestriction": o([
        { json: "country", js: "country", typ: "" },
        { json: "policy", js: "policy", typ: "" },
    ], false),
    "Person": o([
        { json: "id", js: "id", typ: r("PersonID") },
        { json: "name", js: "name", typ: r("Name") },
        { json: "height", js: "height", typ: r("Height") },
        { json: "weight", js: "weight", typ: r("Height") },
        { json: "gender", js: "gender", typ: "" },
        { json: "age", js: "age", typ: 0 },
        { json: "birthDate", js: "birthDate", typ: "" },
        { json: "birthPlace", js: "birthPlace", typ: "" },
        { json: "citizenship", js: "citizenship", typ: a("") },
        { json: "primaryLanguage", js: "primaryLanguage", typ: "" },
        { json: "studentIndicator", js: "studentIndicator", typ: true },
        { json: "communication", js: "communication", typ: r("PersonCommunication") },
    ], false),
    "PersonCommunication": o([
        { json: "address", js: "address", typ: a(r("ReferenceLocationElement")) },
        { json: "phone", js: "phone", typ: a(r("Phone")) },
        { json: "email", js: "email", typ: a(r("PurpleEmail")) },
        { json: "web", js: "web", typ: a(r("Web")) },
    ], false),
    "ReferenceLocationElement": o([
        { json: "useCode", js: "useCode", typ: u(undefined, "") },
        { json: "countryCode", js: "countryCode", typ: "" },
        { json: "countrySubDivisions", js: "countrySubDivisions", typ: a(r("CountrySubDivision")) },
        { json: "city", js: "city", typ: "" },
        { json: "postalCode", js: "postalCode", typ: "" },
        { json: "line", js: "line", typ: "" },
        { json: "extendedLines", js: "extendedLines", typ: u(undefined, a(r("CountrySubDivision"))) },
        { json: "geoLocation", js: "geoLocation", typ: r("GeoLocation") },
        { json: "formattedAddress", js: "formattedAddress", typ: "" },
    ], false),
    "CountrySubDivision": o([
        { json: "type", js: "type", typ: "" },
        { json: "value", js: "value", typ: "" },
    ], false),
    "GeoLocation": o([
        { json: "longitude", js: "longitude", typ: 3.14 },
        { json: "latitude", js: "latitude", typ: 3.14 },
    ], false),
    "PurpleEmail": o([
        { json: "useCode", js: "useCode", typ: "" },
        { json: "preference", js: "preference", typ: 0 },
        { json: "address", js: "address", typ: "" },
    ], false),
    "Phone": o([
        { json: "useCode", js: "useCode", typ: "" },
        { json: "preference", js: "preference", typ: 0 },
        { json: "formattedNumber", js: "formattedNumber", typ: "" },
        { json: "countryDialingCode", js: "countryDialingCode", typ: "" },
        { json: "areaDialingCode", js: "areaDialingCode", typ: "" },
        { json: "dialNumber", js: "dialNumber", typ: "" },
        { json: "availablePeriod", js: "availablePeriod", typ: u(undefined, r("AvailablePeriod")) },
    ], false),
    "AvailablePeriod": o([
        { json: "start", js: "start", typ: "" },
        { json: "end", js: "end", typ: "" },
    ], false),
    "Web": o([
        { json: "name", js: "name", typ: "" },
        { json: "useCode", js: "useCode", typ: u(undefined, "") },
        { json: "url", js: "url", typ: "" },
    ], false),
    "Height": o([
        { json: "value", js: "value", typ: 0 },
        { json: "unitCode", js: "unitCode", typ: "" },
    ], false),
    "PersonID": o([
        { json: "value", js: "value", typ: "" },
        { json: "schemeAgencyId", js: "schemeAgencyId", typ: "" },
        { json: "schemeId", js: "schemeId", typ: "" },
        { json: "schemeVersionId", js: "schemeVersionId", typ: u(undefined, "") },
    ], false),
    "Name": o([
        { json: "formattedName", js: "formattedName", typ: "" },
        { json: "given", js: "given", typ: "" },
        { json: "family", js: "family", typ: "" },
        { json: "preferredSalutationCode", js: "preferredSalutationCode", typ: "" },
    ], false),
    "Profile": o([
        { json: "languageCode", js: "languageCode", typ: "" },
        { json: "profileId", js: "profileId", typ: r("DocumentID") },
        { json: "alternateIds", js: "alternateIds", typ: a(r("DocumentID")) },
        { json: "profileName", js: "profileName", typ: "" },
        { json: "personAvailability", js: "personAvailability", typ: r("PersonAvailability") },
        { json: "distributionGuidelines", js: "distributionGuidelines", typ: r("DistributionGuidelines") },
        { json: "associatedPositionOpenings", js: "associatedPositionOpenings", typ: a(r("AssociatedPositionOpening")) },
        { json: "workLifeCycles", js: "workLifeCycles", typ: a(r("WorkLifeCycle")) },
        { json: "employerPreferences", js: "employerPreferences", typ: a(r("EmployerPreference")) },
        { json: "positionPreferences", js: "positionPreferences", typ: a(r("PositionPreference")) },
        { json: "candidateRelationships", js: "candidateRelationships", typ: a(r("CandidateRelationship")) },
        { json: "candidateSources", js: "candidateSources", typ: a(r("CandidateSource")) },
        { json: "employment", js: "employment", typ: a(r("Employment")) },
        { json: "education", js: "education", typ: a(r("Education")) },
        { json: "licenses", js: "licenses", typ: a(r("License")) },
        { json: "certifications", js: "certifications", typ: a(r("Certification")) },
        { json: "patents", js: "patents", typ: a(r("Patent")) },
        { json: "qualifications", js: "qualifications", typ: a(r("Qualification")) },
        { json: "references", js: "references", typ: a(r("Reference")) },
        { json: "attachments", js: "attachments", typ: a(r("Attachment")) },
    ], false),
    "AssociatedPositionOpening": o([
        { json: "positionOpeningId", js: "positionOpeningId", typ: r("DocumentID") },
        { json: "positionTitle", js: "positionTitle", typ: "" },
        { json: "positionUri", js: "positionUri", typ: "" },
        { json: "candidateAppliedIndicator", js: "candidateAppliedIndicator", typ: true },
        { json: "dispositionStatus", js: "dispositionStatus", typ: r("DispositionStatus") },
    ], false),
    "DispositionStatus": o([
        { json: "name", js: "name", typ: "" },
        { json: "code", js: "code", typ: "" },
        { json: "reasonCode", js: "reasonCode", typ: "" },
        { json: "reasonDescription", js: "reasonDescription", typ: "" },
        { json: "date", js: "date", typ: "" },
    ], false),
    "Attachment": o([
        { json: "id", js: "id", typ: u(undefined, r("RefereeIDElement")) },
        { json: "descriptions", js: "descriptions", typ: a("") },
        { json: "content", js: "content", typ: u(undefined, r("Content")) },
        { json: "url", js: "url", typ: u(undefined, "") },
    ], false),
    "Content": o([
        { json: "value", js: "value", typ: "" },
        { json: "encoding", js: "encoding", typ: "" },
        { json: "mimeType", js: "mimeType", typ: "" },
        { json: "filename", js: "filename", typ: "" },
    ], false),
    "RefereeIDElement": o([
        { json: "value", js: "value", typ: "" },
    ], false),
    "CandidateRelationship": o([
        { json: "candidateRelationshipId", js: "candidateRelationshipId", typ: r("DocumentID") },
        { json: "candidateRelationshipCode", js: "candidateRelationshipCode", typ: "" },
        { json: "otherCandidateRelationshipCode", js: "otherCandidateRelationshipCode", typ: "" },
        { json: "internalCandidateIndicator", js: "internalCandidateIndicator", typ: true },
    ], false),
    "CandidateSource": o([
        { json: "code", js: "code", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "order", js: "order", typ: 0 },
    ], false),
    "Certification": o([
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: r("CertificationType") },
        { json: "id", js: "id", typ: r("CertificationID") },
        { json: "issuingAuthority", js: "issuingAuthority", typ: r("CertificationIssuingAuthority") },
        { json: "status", js: "status", typ: "" },
        { json: "firstIssued", js: "firstIssued", typ: "" },
        { json: "effectiveTimePeriod", js: "effectiveTimePeriod", typ: r("EffectiveTimePeriod") },
    ], false),
    "EffectiveTimePeriod": o([
        { json: "validFrom", js: "validFrom", typ: "" },
        { json: "validTo", js: "validTo", typ: "" },
    ], false),
    "CertificationID": o([
        { json: "value", js: "value", typ: "" },
        { json: "schemeAgencyId", js: "schemeAgencyId", typ: "" },
    ], false),
    "CertificationIssuingAuthority": o([
        { json: "name", js: "name", typ: "" },
        { json: "communication", js: "communication", typ: r("IssuingAuthorityCommunication") },
    ], false),
    "IssuingAuthorityCommunication": o([
        { json: "address", js: "address", typ: a(r("PurpleAddress")) },
    ], false),
    "PurpleAddress": o([
        { json: "city", js: "city", typ: "" },
    ], false),
    "CertificationType": o([
        { json: "code", js: "code", typ: "" },
    ], false),
    "DistributionGuidelines": o([
        { json: "doNotRedistributeIndicator", js: "doNotRedistributeIndicator", typ: true },
        { json: "distributeTo", js: "distributeTo", typ: a(r("DistributeTo")) },
        { json: "doNotDistributeTo", js: "doNotDistributeTo", typ: a(r("DoNotDistributeTo")) },
    ], false),
    "DistributeTo": o([
        { json: "startDate", js: "startDate", typ: "" },
        { json: "endDate", js: "endDate", typ: "" },
        { json: "person", js: "person", typ: u(undefined, r("PersonClass")) },
        { json: "communication", js: "communication", typ: u(undefined, r("DistributeToCommunication")) },
        { json: "organization", js: "organization", typ: u(undefined, r("PersonClass")) },
        { json: "descriptions", js: "descriptions", typ: u(undefined, a("")) },
    ], false),
    "DistributeToCommunication": o([
        { json: "email", js: "email", typ: a(r("FluffyEmail")) },
    ], false),
    "FluffyEmail": o([
        { json: "address", js: "address", typ: "" },
    ], false),
    "PersonClass": o([
        { json: "name", js: "name", typ: "" },
        { json: "id", js: "id", typ: r("RefereeIDElement") },
    ], false),
    "DoNotDistributeTo": o([
        { json: "organization", js: "organization", typ: r("DoNotDistributeToOrganization") },
    ], false),
    "DoNotDistributeToOrganization": o([
        { json: "name", js: "name", typ: "" },
        { json: "id", js: "id", typ: r("RefereeIDElement") },
        { json: "domainName", js: "domainName", typ: "" },
    ], false),
    "Education": o([
        { json: "id", js: "id", typ: r("RefereeIDElement") },
        { json: "start", js: "start", typ: "" },
        { json: "end", js: "end", typ: u(undefined, "") },
        { json: "institution", js: "institution", typ: r("Department") },
        { json: "currentlyAttendingIndicator", js: "currentlyAttendingIndicator", typ: true },
        { json: "department", js: "department", typ: u(undefined, r("Department")) },
        { json: "programs", js: "programs", typ: u(undefined, a("")) },
        { json: "educationLevelCodes", js: "educationLevelCodes", typ: u(undefined, a(r("EducationLevelCode"))) },
        { json: "educationDegrees", js: "educationDegrees", typ: u(undefined, a(r("EducationDegree"))) },
        { json: "attachmentReferences", js: "attachmentReferences", typ: u(undefined, a(r("AttachmentReference"))) },
        { json: "goodStandingIndicator", js: "goodStandingIndicator", typ: u(undefined, true) },
    ], false),
    "AttachmentReference": o([
        { json: "uri", js: "uri", typ: "" },
        { json: "descriptions", js: "descriptions", typ: a("") },
    ], false),
    "Department": o([
        { json: "name", js: "name", typ: "" },
        { json: "communication", js: "communication", typ: u(undefined, r("DepartmentCommunication")) },
    ], false),
    "DepartmentCommunication": o([
        { json: "address", js: "address", typ: a(r("AddressElement")) },
    ], false),
    "AddressElement": o([
        { json: "countryCode", js: "countryCode", typ: "" },
        { json: "countrySubDivisions", js: "countrySubDivisions", typ: a(r("CountrySubDivision")) },
        { json: "city", js: "city", typ: "" },
        { json: "postalCode", js: "postalCode", typ: "" },
        { json: "line", js: "line", typ: u(undefined, "") },
    ], false),
    "EducationDegree": o([
        { json: "name", js: "name", typ: "" },
        { json: "codes", js: "codes", typ: a("") },
        { json: "iscedEducationLevelCode", js: "iscedEducationLevelCode", typ: "" },
        { json: "degreeGrantedStatus", js: "degreeGrantedStatus", typ: "" },
        { json: "date", js: "date", typ: u(undefined, "") },
        { json: "score", js: "score", typ: u(undefined, r("InterestLevel")) },
        { json: "specializations", js: "specializations", typ: a(r("Specialization")) },
    ], false),
    "InterestLevel": o([
        { json: "scoresNumeric", js: "scoresNumeric", typ: a(r("ScoresNumeric")) },
    ], false),
    "ScoresNumeric": o([
        { json: "value", js: "value", typ: 0 },
        { json: "minimum", js: "minimum", typ: 0 },
        { json: "maximum", js: "maximum", typ: 0 },
        { json: "scoreCode", js: "scoreCode", typ: u(undefined, "") },
    ], false),
    "Specialization": o([
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: "" },
    ], false),
    "EducationLevelCode": o([
        { json: "id", js: "id", typ: r("DocumentID") },
        { json: "name", js: "name", typ: "" },
    ], false),
    "EmployerPreference": o([
        { json: "organizationNames", js: "organizationNames", typ: a("") },
        { json: "organizationTypes", js: "organizationTypes", typ: a("") },
        { json: "industryCodes", js: "industryCodes", typ: a(r("DocumentID")) },
        { json: "headcountRange", js: "headcountRange", typ: r("HeadcountRange") },
        { json: "descriptions", js: "descriptions", typ: a("") },
    ], false),
    "HeadcountRange": o([
        { json: "minimum", js: "minimum", typ: 0 },
        { json: "maximum", js: "maximum", typ: 0 },
    ], false),
    "Employment": o([
        { json: "id", js: "id", typ: r("RefereeIDElement") },
        { json: "organization", js: "organization", typ: r("EmploymentOrganization") },
        { json: "start", js: "start", typ: "" },
        { json: "current", js: "current", typ: true },
        { json: "positionHistories", js: "positionHistories", typ: a(r("PositionHistory")) },
        { json: "attachmentReferences", js: "attachmentReferences", typ: a(r("AttachmentReference")) },
    ], false),
    "EmploymentOrganization": o([
        { json: "name", js: "name", typ: "" },
        { json: "domainName", js: "domainName", typ: "" },
        { json: "headCount", js: "headCount", typ: 0 },
        { json: "industryCodes", js: "industryCodes", typ: a("") },
    ], false),
    "PositionHistory": o([
        { json: "id", js: "id", typ: r("RefereeIDElement") },
        { json: "title", js: "title", typ: "" },
        { json: "resourceRelationshipCode", js: "resourceRelationshipCode", typ: "" },
        { json: "organization", js: "organization", typ: r("DoNotDistributeToOrganization") },
        { json: "location", js: "location", typ: r("AddressElement") },
        { json: "start", js: "start", typ: "" },
        { json: "end", js: "end", typ: u(undefined, "") },
        { json: "current", js: "current", typ: u(undefined, true) },
    ], false),
    "License": o([
        { json: "id", js: "id", typ: r("PersonID") },
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: r("TypeElement") },
        { json: "status", js: "status", typ: "" },
        { json: "effectiveTimePeriod", js: "effectiveTimePeriod", typ: r("EffectiveTimePeriod") },
        { json: "firstIssued", js: "firstIssued", typ: "" },
        { json: "issuingAuthority", js: "issuingAuthority", typ: r("LicenseIssuingAuthority") },
        { json: "endorsements", js: "endorsements", typ: a(r("Endorsement")) },
        { json: "restrictions", js: "restrictions", typ: u(undefined, a(r("Restriction"))) },
        { json: "descriptions", js: "descriptions", typ: u(undefined, a("")) },
        { json: "attachmentReferences", js: "attachmentReferences", typ: a(r("AttachmentReference")) },
    ], false),
    "Endorsement": o([
        { json: "value", js: "value", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "validFrom", js: "validFrom", typ: u(undefined, "") },
        { json: "validTo", js: "validTo", typ: u(undefined, "") },
    ], false),
    "LicenseIssuingAuthority": o([
        { json: "name", js: "name", typ: "" },
    ], false),
    "Restriction": o([
        { json: "value", js: "value", typ: "" },
        { json: "validTo", js: "validTo", typ: "" },
    ], false),
    "TypeElement": o([
        { json: "name", js: "name", typ: "" },
        { json: "code", js: "code", typ: "" },
    ], false),
    "Patent": o([
        { json: "ids", js: "ids", typ: a(r("CertificationID")) },
        { json: "issuingAuthority", js: "issuingAuthority", typ: r("LicenseIssuingAuthority") },
        { json: "inventorNames", js: "inventorNames", typ: a("") },
        { json: "assigneeNames", js: "assigneeNames", typ: a("") },
        { json: "title", js: "title", typ: "" },
        { json: "descriptions", js: "descriptions", typ: a("") },
        { json: "status", js: "status", typ: "" },
    ], false),
    "PersonAvailability": o([
        { json: "availabilityDates", js: "availabilityDates", typ: a(r("AvailabilityDate")) },
        { json: "noticePeriodMeasure", js: "noticePeriodMeasure", typ: r("Height") },
        { json: "immediateStartIndicator", js: "immediateStartIndicator", typ: true },
    ], false),
    "AvailabilityDate": o([
        { json: "startDateTime", js: "startDateTime", typ: "" },
        { json: "endDateTime", js: "endDateTime", typ: "" },
    ], false),
    "PositionPreference": o([
        { json: "locations", js: "locations", typ: a(r("PositionPreferenceLocation")) },
        { json: "jobCategories", js: "jobCategories", typ: a(r("TypeElement")) },
        { json: "positionTitles", js: "positionTitles", typ: a("") },
        { json: "positionOfferingTypeCodes", js: "positionOfferingTypeCodes", typ: a("") },
        { json: "positionScheduleTypeCodes", js: "positionScheduleTypeCodes", typ: a("") },
        { json: "shiftSchedules", js: "shiftSchedules", typ: a(r("ShiftSchedule")) },
        { json: "shiftDescriptions", js: "shiftDescriptions", typ: a("") },
        { json: "remoteWork", js: "remoteWork", typ: r("RemoteWork") },
        { json: "careerLevelCodes", js: "careerLevelCodes", typ: a("") },
        { json: "offeredRemunerationPackage", js: "offeredRemunerationPackage", typ: r("OfferedRemunerationPackage") },
        { json: "travel", js: "travel", typ: r("Travel") },
        { json: "relocation", js: "relocation", typ: r("Relocation") },
        { json: "workingLanguageCodes", js: "workingLanguageCodes", typ: a("") },
    ], false),
    "PositionPreferenceLocation": o([
        { json: "maximumCommuteDuration", js: "maximumCommuteDuration", typ: r("Height") },
        { json: "maximumCommuteDistance", js: "maximumCommuteDistance", typ: r("Height") },
        { json: "referenceLocation", js: "referenceLocation", typ: r("ReferenceLocationElement") },
    ], false),
    "OfferedRemunerationPackage": o([
        { json: "basisCode", js: "basisCode", typ: "" },
        { json: "ranges", js: "ranges", typ: a(r("Range")) },
        { json: "descriptions", js: "descriptions", typ: a("") },
    ], false),
    "Range": o([
        { json: "typeCode", js: "typeCode", typ: "" },
        { json: "minimumAmount", js: "minimumAmount", typ: r("ImumAmount") },
        { json: "intervalCode", js: "intervalCode", typ: "" },
        { json: "maximumAmount", js: "maximumAmount", typ: u(undefined, r("ImumAmount")) },
    ], false),
    "ImumAmount": o([
        { json: "value", js: "value", typ: 0 },
        { json: "currency", js: "currency", typ: "" },
    ], false),
    "Relocation": o([
        { json: "willingToRelocateIndicator", js: "willingToRelocateIndicator", typ: true },
    ], false),
    "RemoteWork": o([
        { json: "remoteWorkIndicator", js: "remoteWorkIndicator", typ: true },
        { json: "workLocationCodes", js: "workLocationCodes", typ: a("") },
        { json: "restrictionCodes", js: "restrictionCodes", typ: a("") },
        { json: "restrictionDetails", js: "restrictionDetails", typ: "" },
    ], false),
    "ShiftSchedule": o([
        { json: "schedules", js: "schedules", typ: a(r("Schedule")) },
    ], false),
    "Schedule": o([
        { json: "startDate", js: "startDate", typ: "" },
        { json: "endDate", js: "endDate", typ: "" },
    ], false),
    "Travel": o([
        { json: "willingToTravelIndicator", js: "willingToTravelIndicator", typ: true },
        { json: "percentage", js: "percentage", typ: 0 },
    ], false),
    "Qualification": o([
        { json: "competencyIds", js: "competencyIds", typ: a(r("CompetencyID")) },
        { json: "competencyName", js: "competencyName", typ: "" },
        { json: "proficiencyLevel", js: "proficiencyLevel", typ: r("ProficiencyLevel") },
        { json: "experienceMeasure", js: "experienceMeasure", typ: r("Height") },
        { json: "lastUsedDate", js: "lastUsedDate", typ: "" },
        { json: "interestLevel", js: "interestLevel", typ: r("InterestLevel") },
    ], false),
    "CompetencyID": o([
        { json: "value", js: "value", typ: "" },
        { json: "schemeId", js: "schemeId", typ: "" },
        { json: "schemeVersionId", js: "schemeVersionId", typ: "" },
        { json: "schemeAgencyId", js: "schemeAgencyId", typ: "" },
        { json: "schemeLink", js: "schemeLink", typ: "" },
        { json: "agencyUri", js: "agencyUri", typ: "" },
    ], false),
    "ProficiencyLevel": o([
        { json: "scoresText", js: "scoresText", typ: a(r("RefereeIDElement")) },
    ], false),
    "Reference": o([
        { json: "personName", js: "personName", typ: r("PersonName") },
        { json: "organizationName", js: "organizationName", typ: "" },
        { json: "positionTitle", js: "positionTitle", typ: "" },
        { json: "communication", js: "communication", typ: r("DistributeToCommunication") },
        { json: "refereeId", js: "refereeId", typ: r("RefereeIDElement") },
        { json: "relationship", js: "relationship", typ: "" },
        { json: "yearsKnown", js: "yearsKnown", typ: 0 },
        { json: "comments", js: "comments", typ: a(r("Comment")) },
        { json: "attachmentReferences", js: "attachmentReferences", typ: a(r("AttachmentReference")) },
    ], false),
    "Comment": o([
        { json: "note", js: "note", typ: "" },
    ], false),
    "PersonName": o([
        { json: "given", js: "given", typ: "" },
        { json: "family", js: "family", typ: "" },
    ], false),
    "WorkLifeCycle": o([
        { json: "recruitingAndStaffing", js: "recruitingAndStaffing", typ: r("RecruitingAndStaffing") },
        { json: "contract", js: "contract", typ: r("Contract") },
        { json: "hire", js: "hire", typ: r("Hire") },
    ], false),
    "Contract": o([
        { json: "contractNumber", js: "contractNumber", typ: r("RefereeIDElement") },
        { json: "contractStartDate", js: "contractStartDate", typ: "" },
        { json: "contractEndDate", js: "contractEndDate", typ: "" },
        { json: "workRelationshipType", js: "workRelationshipType", typ: "" },
    ], false),
    "Hire": o([
        { json: "date", js: "date", typ: "" },
        { json: "expectedFirstWorkDate", js: "expectedFirstWorkDate", typ: "" },
        { json: "typeCode", js: "typeCode", typ: "" },
    ], false),
    "RecruitingAndStaffing": o([
        { json: "applicationDate", js: "applicationDate", typ: "" },
        { json: "interviewDates", js: "interviewDates", typ: a("") },
        { json: "offeredOnDate", js: "offeredOnDate", typ: "" },
        { json: "offerAcceptedDate", js: "offerAcceptedDate", typ: "" },
    ], false),
};

module.exports = {
    "candidateExtendedToJson": candidateExtendedToJson,
    "toCandidateExtended": toCandidateExtended,
};
