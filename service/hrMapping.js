const _ = require('underscore')
module.exports = async (data) => {
  let phones = []
  let boards = []
  let education = {}
  let qualifications = []
  let datafile = null
  let filename = null
  if (data.phoneNumbers && data.phoneNumbers.length > 0) {
    data.phoneNumbers.forEach((item) => {
      phones.push({
        useCode: 'private',
        formattedNumber: item.phoneNumberValue,
      })
    })
  }

  if (data.boards.length > 0) {
    data.boards.forEach((item) => {
      boards.push({
        name: item.name,
        code: item.id,
      })
    })
  }
  if (data.relevance.skills && data.relevance.skills.length > 0) {
    data.relevance.skills.forEach((item) => {
      qualifications.push({
        competencyName: item.name,
        experienceMeasure: {
          value: item.yearsOfExperience,
        },
      })
    })
  }
  if (data.highestEducationDegree) {
    education = [
      {
        id: {
          value: 'EDUHIST1',
        },
        educationDegrees: [
          {
            name: data.highestEducationDegree,
            codes: [data.highestEducationDegree],
          },
        ],
      },
    ]
  }
  let hrJson = {
    person: {
      id: {
        value: data.identity.textResumeID,
      },
      name: {
        formattedName: data.identity.name,
      },
      communication: {
        address: [
          {
            useCode: 'private',
            countryCode: data.location.country,
            city: data.location.city,
            postalCode: data.location.postalCode,
          },
        ],
        phone: phones,
        email: [
          {
            useCode: 'private',
            preference: 1,
            address: data.identity.emailAddress,
          },
        ],
      },
    },
    profiles: {
      profileId: {
        value: data.identity.textResumeID,
      },
      candidateSources: boards,
      education,
      positionPreferences: [
        {
          relocation: {
            willingToRelocateIndicator: data.location.willRelocate,
          },
          positionTitles: [data.targetJobTitle],

          offeredRemunerationPackage: {
            basicCode: 'salaried',
            ranges: [
              {
                minimumAmount: {
                  value: data.desiredSalary.min,
                  currency: data.desiredSalary.currency,
                },
                intervalCode: data.desiredSalary.period,
              },
              {
                maximumAmount: {
                  value: data.desiredSalary.max,
                  currency: data.desiredSalary.currency,
                },
                intervalCode: data.desiredSalary.period,
              },
            ],
          },
        },
      ],
      qualifications,
    },
  }
  let base64htmlCV = null
  if (data.resume) {
    let buff = new Buffer.from(data.resume)
    base64htmlCV = buff.toString('base64')
  }

  if (data.resumeDocument) {
    filename = data.resumeDocument.fileName
    datafile = data.resumeDocument.file
  }

  return {
    data: hrJson,
    html: base64htmlCV,
    resume: datafile,
    file_name: filename,
  }
}
