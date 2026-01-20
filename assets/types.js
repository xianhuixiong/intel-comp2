/**
 * JSDoc typedefs for editor intellisense (no runtime dependency).
 *
 * The schema is designed to match the information architecture described in the
 * 2026 construction方案 for the “反垄断国际交流合作数据库模块”.
 */

/**
 * @typedef {Object} Translation
 * @property {"Full"|"Key points"|"Title"|"None"|"—"} [zh]
 * @property {"Full"|"Key points"|"Title"|"None"|"—"} [en]
 */

/**
 * @typedef {Object} Link
 * @property {string} label
 * @property {string} url
 */

/**
 * @typedef {Object} CoopDocument
 * @property {string} id
 * @property {"Bilateral"|"Multilateral"|"FTA"} category
 * @property {string} type
 * @property {string} title
 * @property {string} titleCn
 * @property {string[]} parties
 * @property {string} signedDate
 * @property {string} inForceDate
 * @property {string} summaryCn
 * @property {string[]} keyPointsCn
 * @property {string[]} tags
 * @property {string} language
 * @property {Translation} translation
 * @property {string} sourceName
 * @property {string} sourceUrl
 * @property {string[]} alternateUrls
 * @property {string[]} relatedJurisdictions
 * @property {string[]} relatedOrgs
 */

/**
 * @typedef {Object} Law
 * @property {string} id
 * @property {string} jurisdiction
 * @property {"Statute"|"Regulation"|"Treaty Provision"|"Guideline"} type
 * @property {string} level
 * @property {string} nameEn
 * @property {string} nameCn
 * @property {string} adoptedDate
 * @property {string} lastAmendedDate
 * @property {string} issuingBody
 * @property {Translation} translation
 * @property {string} summaryCn
 * @property {string[]} keyTopics
 * @property {string} sourceUrl
 * @property {string} sourceName
 */

/**
 * @typedef {Object} Agency
 * @property {string} id
 * @property {string} jurisdiction
 * @property {string} nameEn
 * @property {string} nameCn
 * @property {string} abbrev
 * @property {string} type
 * @property {string} website
 * @property {string} mandateCn
 * @property {{focusCn:string[],relatedDocs:string[],relatedOrgs:string[]}} cooperation
 * @property {{country:string,address:string,email?:string}} contacts
 * @property {string} sourceUrl
 */

/**
 * @typedef {Object} InternationalOrg
 * @property {string} id
 * @property {string} nameEn
 * @property {string} nameCn
 * @property {string} abbrev
 * @property {string} type
 * @property {string} website
 * @property {string} overviewCn
 * @property {string[]} keyMechanismsCn
 * @property {string} sourceUrl
 */

/**
 * @typedef {Object} PolicyUpdate
 * @property {string} id
 * @property {string} date
 * @property {string} title
 * @property {string} titleCn
 * @property {"Update"|"Report"|"Instrument"|"Event"} type
 * @property {number} importance
 * @property {string} jurisdictionOrOrg
 * @property {string} summaryCn
 * @property {string} sourceUrl
 * @property {string} language
 * @property {boolean} translated
 * @property {string[]} tags
 * @property {string[]} [related]
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {string} date
 * @property {string} label
 * @property {string} noteCn
 * @property {string} [sourceUrl]
 */

/**
 * @typedef {Object} MajorCase
 * @property {string} id
 * @property {string} title
 * @property {string} titleCn
 * @property {string} jurisdiction
 * @property {string} authority
 * @property {string} decisionDate
 * @property {string} caseNo
 * @property {string} sector
 * @property {string} conductCn
 * @property {string} outcomeCn
 * @property {string} penalty
 * @property {Link[]} keyDocs
 * @property {TimelineEvent[]} timeline
 * @property {string} analysisCn
 * @property {string[]} tags
 * @property {string[]} relatedLaws
 * @property {string[]} relatedAgencies
 */

/**
 * @typedef {Object} ResearchItem
 * @property {string} id
 * @property {string} title
 * @property {string} titleCn
 * @property {string} type
 * @property {string} publisher
 * @property {string} publishDate
 * @property {string} language
 * @property {boolean} translated
 * @property {string} summaryCn
 * @property {string[]} tags
 * @property {string} sourceUrl
 */

/**
 * @typedef {Object} GlossaryEntry
 * @property {string} term
 * @property {string} termEn
 * @property {string} definitionCn
 * @property {string[]} tags
 */

export {};
