const path = require('path')
const Generator = require('yeoman-generator')
const hostile = require('hostile')

module.exports = class extends Generator {
  initializing () {
    this.log('initializing')
    this.sourceRoot(path.join(__dirname, 'templates'))
    if (!this.options.hostile) {
      this.hostile = hostile
    } else {
      // Passing hostile as an argument allows us to stub it's api for unit tests
      this.hostile = this.options.hostile
    }
    if (!this.options.sudoOverride && process.getuid() !== 0) {
      throw new Error('Generator needs root access to write hosts file')
    }
  }

  configuring () {
    this.log('configuring')
    try {
      const lines = this.hostile.getFile(this.templatePath('hosts'), false)
      const setLines = this.hostile.get() // Parse current hosts file
      const missingLines = lines.filter(line => {
        // Determine if hostname is already set for this line
        return setLines.findIndex(l => l[1] === line[1]) === -1
      })
      if (missingLines.length) {
        missingLines.forEach(line => {
          this.log(`Adding host ${line[1]} to your hosts file`)
          this.hostile.set(line[0], line[1])
        })
      } else {
        this.log('Looks like your hosts file is setup properly')
      }
    } catch (e) {
      throw new Error(`Uh oh, there was an error reading your hosts file`)
    }
  }

  writingLoopbackAlias () {
    this.log('Writing loopback alias...')
    this.fs.copy(
      this.templatePath('./loopbackAlias'),
      this.destinationPath('./loopbackAlias')
    )
  }

  loopbackAlias () {
    this.log('Checking if Loopback Alias is setup properly...')
    // Determine if our Loopback alias is already configured
    const ifconf = this.spawnCommandSync('ifconfig', {})
    if (ifconf.stdout && ifconf.stdout.toString().indexOf('10.200.10.1') < 0) {
      this.log('Setting up LOOPBACK Alias. I will need your system password')
      this.spawnCommandSync('bash', [this.destinationPath('./loopbackAlias/setupLoopbackAlias.sh')])
    } else {
      this.log('Looks like your Loopback Alias is setup properly')
    }
  }

  end () {
    this.log('end')
  }
}