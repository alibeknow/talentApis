const searchModel = require('./searchModel')
const monsterService = require('../services/candidateControllerService')
const diceService = require('../services/diceService')
const lensaService = require('../services/lensaService')
const _ = require('underscore')
module.exports = async (source, search) => {
  let searchArray = []
  let promisesResponse = []
  let response
  if (source == 'all') {
    promisesResponse = searchModel.map(async (item) => {
      if (item == 'monster') {
        searchArray[item] = await builder(search, item)
        return await monsterService.getCandidates(searchArray[item], search.SearchRequest.page, search.SearchRequest.pageSize, true)
      } else if (item == 'dice') {
        searchArray[item] = await builder(search, item)
        searchArray[item].searchParameters = _.pick(searchArray[item].searchParameters, _.identity)
        return await diceService.getCandidates(searchArray[item])
      }
    })
    response = await Promise.all(promisesResponse).catch((err) => console.log(err))
    return response
  }

  if (source == 'monster') {
    searchArray[source] = await builder(search, source)
    searchArray[source] = _.pick(searchArray[source], _.identity)
    return await monsterService.getCandidates(searchArray[source], searchArray[source].page, searchArray[source].pageSize, true)
  } else if (source == 'dice') {
    searchArray[source] = await builder(search, source).catch((err) => console.log(err))
    searchArray[source].searchParameters = _.pick(searchArray[source].searchParameters, _.identity)
    try {
      return await diceService.getCandidates(searchArray[source])
    } catch (error) {
      return error
    }
  }
}

async function builder(search, source) {
  let salary = null
  let locations = null
  let skills = null
  let education = null
  let currencyCode = null
  let keywords = null
  let skillYearsOfExperience = null
  let responseObject = null
  let resumeId = null
  let keyWordJob = null
  let keyWordCompany = null
  let keyWordSkills = null
  let yearsOfExperience = null
  search.SearchRequest.searchType || 'jobDetail'
  switch (source) {
    case 'monster':
      if (search.SearchRequest.keywords) {
        keywords = []
        Object.values(search.SearchRequest.keywords)
          .map((item) => {
            keywords.push(item)
          })
          .join(',')
      }
      if (search.SearchRequest.resumeId) {
        resumeId = search.SearchRequest.resumeId[item]
      }
      if (search.SearchRequest.salary) {
        salary = {
          minimum: search.SearchRequest.salary.minimum,
          maximum: search.SearchRequest.salary.maximum,
          currencyAbbrev: search.SearchRequest.salary.currencyAbbrev,
          includeResumesWithoutSalary: search.SearchRequest.salary.includeResumesWithoutSalary,
        }
      }
      if (search.SearchRequest.education) {
        education = {
          schools: search.SearchRequest.education.schools || null,
          degrees: search.SearchRequest.education.degrees || null,
        }
      }
      if (search.SearchRequest.searchType === 'JobDetail') {
        return {
          searchType: 'JobDetail',
          jobDetail: {
            jobTitle: search.SearchRequest.jobTitle || null,
            jobDescription: search.SearchRequest.jobDescription || null,
            locations: search.SearchRequest.locations || null,
          },
        }
      } else {
        return {
          country: search.SearchRequest.country || null,
          searchType: search.SearchRequest.searchType || 'Semantic',
          resumeBoardId: resumeId,
          semantic: {
            jobTitles: search.SearchRequest.jobTitle || null,
            skills: search.SearchRequest.skills || null,
            locations: search.SearchRequest.locations,
            yearsOfExperience: search.SearchRequest.yearsOfExperience || null,
            education,
            companies: search.SearchRequest.companies,
            jobTenure: search.SearchRequest.jobTenure,
            lastActiveMaximumAge: search.SearchRequest.lastActiveMaximumAge,
            resumeUpdatedMaximumAge: search.SearchRequest.resumeUpdatedMaximumAge,
            resumeUpdatedMinimumAge: search.SearchRequest.resumeUpdatedMinimumAge,
            importance: search.SearchRequest.importance,
            willingnessToRelocate: search.SearchRequest.willingnessToRelocate,
            willingnessToTravel: search.SearchRequest.willingnessToTravel,
            candidateName: search.SearchRequest.candidateName,
            careerLevels: search.SearchRequest.careerLevels,
            jobTypes: search.SearchRequest.jobTypes,
            veteranCandidates: search.SearchRequest.veteranCandidates,
            salary: salary,
            workAuthorizations: search.SearchRequest.workAuthorizations || null,
            keywords: keywords,
          },
        }
      }
    case 'dice':
      if (search.SearchRequest.locations && search.SearchRequest.locations.length > 0) {
        locations = []
        for (let item of search.SearchRequest.locations) {
          locations.push(
            _.pick(
              {
                value: `${item.city}, ${item.state}`,
                distance: item.radius,
                distanceUnit: item.radiusUnit,
              },
              _.identity,
            ),
          )
        }
      }
      if (search.SearchRequest.skillYearsOfExperience && search.SearchRequest.skillYearsOfExperience.length > 0) {
        skillYearsOfExperience = search.SearchRequest.skillYearsOfExperience.map((item) => {
          skillYearsOfExperience.push([`${item.name}|${item.years}`])
        })
      }
      if (search.SearchRequest.willingnessToTravel && search.SearchRequest.willingnessToTravel !== 'NoTravelRequired') {
        search.SearchRequest.willingnessToTravel = null
      }

      if (search.SearchRequest.skills && search.SearchRequest.skills.length > 0) {
        skills = search.SearchRequest.skills
          .map((item) => {
            return item.name
          })
          .join(',')
      }
      if (search.SearchRequest.education) {
        education = search.SearchRequest.education
          .map((item) => {
            return Object.values(item)
          })
          .join(',')
      }
      if (search.SearchRequest.salary) {
        salary = `${search.SearchRequest.salary.minimum} - ${search.SearchRequest.salary.maximum}`
        currencyCode = search.SearchRequest.salary.currencyAbbrev
      }

      if (search.SearchRequest.keywords && search.SearchRequest.keywords.company) {
        keyWordCompany = search.SearchRequest.keywords.company
      }
      if (search.SearchRequest.keywords && search.SearchRequest.keywords.skills) {
        keyWordSkills = search.SearchRequest.keywords.skills
      }
      if (search.SearchRequest.keywords && search.SearchRequest.keywords.job) {
        keyWordJob = search.SearchRequest.keywords.job
      }
      if (search.SearchRequest.yearsOfExperience && search.SearchRequest.yearsOfExperience.expression)
        yearsOfExperience = search.SearchRequest.yearsOfExperience.expression
      return {
        searchParameters: {
          locations: locations,
          sortBy: search.SearchRequest.sortBy || null,
          page: search.SearchRequest.page || null,
          pageSize: search.SearchRequest.pageSize || null,
          hasEmail: search.SearchRequest.hasEmail,
          hasPhoneNumber: search.SearchRequest.hasPhoneNumber,
          willingToRelocate: search.SearchRequest.willingToRelocate,
          company: search.SearchRequest.companies,
          skills: skills || null,
          educationDegree: education,
          annualSalary: salary,
          currencyCode: currencyCode,
          lastActive: search.SearchRequest.lastActiveMaximumAge,
          yearsOfExperience: yearsOfExperience,
          sortByDirection: search.SearchRequest.sortByDirection,
          dateResumeLastUpdated: search.SearchRequest.resumeUpdatedMaximumAge,
          companyKeyword: keyWordCompany,
          skillsKeyword: keyWordSkills,
          jobTitleKeyword: keyWordJob,
          language: search.SearchRequest.language || null,
          excludeFounders: search.SearchRequest.excludeFounders || null,
          hasPatent: search.SearchRequest.hasPatent || null,
          skillYearsOfExperience: skillYearsOfExperience || null,
          workPermitLocation: search.SearchRequest.willingnessToRelocate,
        },
      }
  }
}
