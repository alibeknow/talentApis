const _ = require('underscore')
module.exports = async (data) => {
  let boards = []
  let education = null
  let qualifications = []
  let phone = []
  if (data.phone_number) {
    phone = [
      {
        useCode: 'private',
        formattedNumber: data.phone_number,
      },
    ]
  }

  if (data.candidate_source) {
    boards.push({
      name: data.candidate_source,
      code: data.candidate_source,
    })
  }

  qualifications.push({
    competencyName: data.job_category,
    experienceMeasure: {
      value: data.experience,
    },
  })

  if (data.education) {
    education = [
      {
        id: {
          value: 'EDUHIST1',
        },
        educationDegrees: [
          {
            name: data.education,
            codes: [data.education],
          },
        ],
      },
    ]
  }
  let hrJson = {
    person: {
      id: {
        value: data.email,
      },
      name: {
        formattedName: `${data.first_name} ${data.last_name}`,
        given: data.first_name || null,
        family: data.last_name || null,
      },
      communication: {
        address: [
          {
            useCode: 'private',
            state: data.state || null,
            countryCode: 'USA',
            city: data.city,
          },
        ],
        phone: phone,
        email: [
          {
            useCode: 'private',
            preference: 1,
            address: data.email,
          },
        ],
      },
    },
    profiles: {
      profileId: {
        value: data.email,
      },
      candidateSources: boards,
      education,
      positionPreferences: [
        {
          positionTitles: [data.job_title],

          offeredRemunerationPackage: {
            basicCode: 'salaried',
            ranges: [
              {
                minimumAmount: {
                  value: data.income,
                  currency: 'USD',
                },
                intervalCode: 'year',
              },
              {
                maximumAmount: {
                  value: data.income,
                  currency: 'USD',
                },
                intervalCode: 'year',
              },
            ],
          },
        },
      ],
      qualifications,
    },
  }

  return {
    data: hrJson,
  }
}
