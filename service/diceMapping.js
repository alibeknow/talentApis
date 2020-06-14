const _ = require('underscore')
module.exports = async (data) => {
  const { location, resume, email, phone, socialProfiles, workPreferences, yearsOfExperience, employment, skills, experience } = data
  let address = null
  let emailCV = null
  let phoneCV = null
  let web = null
  let workPreferencesCV = null
  let jobHistory = null
  let jobTitles = null
  let remoteWork = null
  let salary = null
  let salaryRangeArray = null
  let skillsCV = null
  let file
  let fileName
  let htmlFile
  if (location) {
    address = []
    for (let item of location) {
      address.push(
        _.pick(
          {
            useCode: 'private',
            countryCode: location.country,
            city: location.city,
            postalCode: location.postalCode,
            geoLocation: {
              longitude: location.longitude,
              latitude: location.latitude,
            },
            formattedAddress: location.text,
          },
          _.identity,
        ),
      )
    }
  }
  if (email) {
    emailCV = []
    for (let item of email) {
      emailCV.push({
        useCode: 'private',
        address: item,
      })
    }
  }
  if (phone) {
    phoneCV = []
    for (let item of phone) {
      phoneCV.push({
        useCode: 'private',
        formattedNumber: item,
      })
    }
  }
  if (socialProfiles) {
    web = []
    for (let item of socialProfiles) {
      web.push({
        useCode: 'private',
        name: item.source,
        url: item.url,
      })
    }
  }
  if (workPreferences) {
    workPreferencesCV = []
    for (let item of workPreferences) {
      if (item.employmentType)
        workPreferencesCV.push({
          positionScheduleTypeCodes: item.employmentType,
          relocation: {
            willingToRelocateIndicator: item.willingToRelocate,
          },
        })
    }
    if (workPreferences.preferredWorkLocations) {
      for (let item of workPreferences.preferredWorkLocations) {
        workPreferencesCV.push({
          workLocationCodes: item.countryCode,
          fullAddres: item.text,
        })
      }
    }
  }
  if (workPreferences.annualSalary) {
    salaryRangeArray = []
    salaryRangeArray.push(
      {
        typeCode: 'BasePay',
        minimumAmount: {
          value: workPreferences.annualSalary.min,
          currency: workPreferences.annualSalary.currency,
        },
        intervalCode: 'Year',
      },
      {
        maximumAmount: {
          value: workPreferences.annualSalary.max,
          currency: workPreferences.annualSalary.currency,
        },
        intervalCode: 'Year',
      },
    )
    salary = {
      offeredRemunerationPackage: {
        basisCode: 'Salaried',
        ranges: salaryRangeArray,
      },
    }
  }
  if (workPreferences.hourlyRate) {
    salaryRangeArray.push(
      {
        typeCode: 'BasePay',
        minimumAmount: {
          value: workPreferences.hourlyRate.min,
          currency: workPreferences.hourlyRate.currency,
        },
        intervalCode: 'hour',
      },
      {
        maximumAmount: {
          value: workPreferences.hourlyRate.max,
          currency: workPreferences.hourlyRate.currency,
        },
        intervalCode: 'hour',
      },
    )
    salary = {
      offeredRemunerationPackage: {
        basisCode: 'piecework pay',
        ranges: salaryRangeArray,
      },
    }
  }
  if (data.desiredJobTitles && data.desiredJobTitles.length > 0) {
    jobTitles = data.desiredJobTitles
    jobTitles.push(data.currentJobTitle)
    workPreferences.positionTitles = jobTitles
  } else {
    workPreferences.positionTitles = data.currentJobTitle
  }
  if (experience) {
    jobHistory = []
    if (_.isUndefined(experience.current)) {
      jobHistory.push({
        organization: {
          name: experience.current.org,
          location: experience.current.location,
        },
        start: `${experience.current.periodStart.year}-${experience.current.periodStart.month}`,
        current: true,
        positionHistories: [{ title: experience.current.title }],
      })
    }
    if (experience.history && experience.history.length > 0) {
      for (let item of experience.history) {
        let endPeriod = null
        let startPeriod = null

        let thisObj = {
          organization: {
            name: item.org,
            location: item.location,
          },
          positionHistories: [{ title: item.title }],
          travel: {
            willingToTravelIndicator: data.likelyToMove,
            percentage: data.likelyToMove,
          },
          remoteWork: {
            workLocationCodes: [],
          },
        }
        if (!_.isUndefined(item.periodEnd)) {
          endPeriod = `${item.periodEnd.year}-${item.periodEnd.month}`
          thisObj.end = endPeriod
        }

        if (!_.isUndefined(item.periodStart)) {
          startPeriod = `${item.periodStart.year}-${item.periodStart.month}`
          thisObj.start = startPeriod
        }

        jobHistory.push(thisObj)
      }
    }
  }
  if (skills && skills.length > 0) {
    skillsCV = []
    for (let skill of skills) {
      skillsCV.push({
        competencyName: skill.skill,
        experienceMeasure: {
          value: skill.score,
          unitCode: 'score',
        },
        lastUsedDate: skill.lastUsed,
        yearsUsed: skill.yearsUsed,
      })
    }
  }
  let hrJson = {
    person: {
      id: { value: data.id },
      schemeAgencyId: 'DICE',

      name: {
        given: data.firstName || null,
        family: data.lastName || null,
      },
      communication: {
        address: address,
        phone: phoneCV,
        email: emailCV,
        web: web,
      },
    },
    profiles: {
      profileId: {
        value: data.id,
        schemeId: 'DICE',
      },
      profileName: 'DICE CV',
      yearsOfExperience: yearsOfExperience,
      positionPreferences: workPreferences,
      employment: experience,
      dateLastActive: data.dateLastActive,
      dateResumeLastUpdated: data.dateResumeLastUpdated,
      qualifications: skillsCV,
    },
  }
  if (resume) {
    fileName = resume.filename ? resume.filename : null
    file = resume.resumeData ? resume.resumeData : null
    htmlFile = resume.html ? new Buffer(resume.resumeHtml).toString('base64') : null
  }
  return { data: hrJson, resume: file, file_name: fileName, html: htmlFile }
}
