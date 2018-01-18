const aws = require('../lib/aws')

class Bucket {

  constructor (options) {
    this._options = Object.assign({}, options)
  }

  get options () {
    return this._options
  }

  get name () {
    return this.options.name
  }

  get site () {
    return this.options.site
  }

  get data () {
    return this._data
  }

  get siteInfo () {
    return this._siteInfo
  }

  exists () {
    return this._exists()
  }

  create () {
    return this.exists()
              .then(() => {
                throw new Error('awsome-bucket-exists')
              })
              .catch((error) => {
                if (error.message === 'awsome-bucket-exists') {
                  throw new Error('Bucket already exists')
                }
                return this._create().then(() => {
                  if (!this.site) {
                    return this
                  }
                  return this._createSite()
                })
              })
  }

  retrieve () {
    return this.exists()
              .then(() => this._retrieve())
              .then(() => {
                if (this.site) {
                  return this._retrieveSite()
                }
                return this
              })
  }

  delete (options) {
    return this.exists()
              .then(() => {
                if (!this.site) {
                  return this
                }
                return this._deleteSite()
              })
              .then(() => this._delete())
  }

  _exists () {
    return aws.s3('headBucket', { Bucket: this.name }).then(() => {
      return this
    })
  }

  _create () {
    return aws.s3('createBucket', { Bucket: this.name }).then(() => {
      return this
    })
  }

  _retrieve () {
    return aws.s3('listObjectsV2', { Bucket: this.name }).then((data) => {
      this._data = Object.assign({}, data)
      return this
    })
  }

  _delete () {
    return aws.s3('deleteBucket', { Bucket: this.name }).then(() => {
      this._data = null
      return this
    })
  }

  _createSite () {
    return aws.s3('putBucketWebsite', Object.assign({}, {
      Bucket: this.name,
      ContentMD5: '',
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: 'index.html'
        },
        IndexDocument: {
          Suffix: 'index.html'
        }
      }
    }, this.site.redirectTo && {
      RedirectAllRequestsTo: {
        HostName: this.site.redirectTo
      }
    })).then(() => this._retrieveSite())
  }

  _retrieveSite () {
    return aws.s3('getBucketWebsite', { Bucket: this.name }).then((siteInfo) => {
      this._siteInfo = Object.assign({}, siteInfo)
      return this
    })
  }

  _deleteSite () {
    return aws.s3('deleteBucketWebsite', { Bucket: this.name }).then(() => {
      this._siteInfo = null
      return this
    })
  }
}

module.exports = Bucket