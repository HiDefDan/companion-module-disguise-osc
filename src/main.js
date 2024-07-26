const { InstanceBase, Regex, runEntrypoint, combineRgb } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')

const osc_server = require('./osc_server.js')
const choices = require('./choices')
const utils = require('./utils')
const actions = require('./actions')
const presets = require('./presets')
const feedbacks = require('./feedbacks')
const variables = require('./variables')

class disguiseOSCInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		Object.assign(this, {
			...actions,
			...presets,
			...feedbacks,
			...variables,
		})

		this.updateStatus('Disconnected')
	}

	async init(config, firstInit) {
		let self = this

		this.config = config

		osc_server.connect(this)
		this.updateStatus('ok')
		// this.updateActions() // export actions

		self.initActions()
		self.initPresets()
		self.initFeedbacks()
		self.initVariables()

		this.blink_button = setInterval(() => {
			this.blink_button = !this.blink_button

			this.checkFeedbacks()
		}, 500)

		await this.configUpdated(config)
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
		osc_server.close(this)
		delete osc_server(this)
	}

	async configUpdated(config) {
		osc_server.close(this)

		this.config = config

		osc_server.connect(this)
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				id: 'host',
				type: 'textinput',
				label: 'Target IP',
				width: 6,
				default: '192.168.23.216',
				regex: Regex.IP,
			},
			{
				id: 'send_port',
				type: 'textinput',
				label: 'Send Port',
				width: 3,
				default: 7401,
				regex: Regex.PORT,
			},
			{
				id: 'recieve_port',
				type: 'textinput',
				label: 'Receive Port',
				width: 3,
				default: 7400,
				regex: Regex.PORT,
			},
		]
	}
	sendOscMessage(path, args) {
		this.log('debug', `Sending OSC ${this.config.host}:${this.config.send_port} ${path}`)
		this.log('debug', `Sending Args ${JSON.stringify(args)}`)
		this.oscSend(this.config.host, this.config.send_port, path, args)
	}
	// updateActions() {
	// 	const layer_base_address = '/d3/layer/'

	// 	this.setActionDefinitions({
	// 		play: {
	// 			name: 'Play',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/play'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		playsection: {
	// 			name: 'Play to end of section',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/playsection'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		loopsection: {
	// 			name: 'Loop section',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/loop'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		stop: {
	// 			name: 'Stop',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/stop'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		previoussection: {
	// 			name: 'Previous section',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/previoussection'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		nextsection: {
	// 			name: 'Next section',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/nextsection'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		returntostart: {
	// 			name: 'Return to start',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/returntostart'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		previoustrack: {
	// 			name: 'Previous track',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/previoustrack'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		nexttrack: {
	// 			name: 'Next track',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/nexttrack'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		trackname: {
	// 			name: 'Track name',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Track name (string)',
	// 					id: 'string',
	// 					default: 'text',
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const path = '/d3/showcontrol/trackname'
	// 				const string = await this.parseVariablesInString(event.options.string)

	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 's',
	// 						value: '' + string,
	// 					},
	// 				])
	// 			},
	// 		},
	// 		trackid: {
	// 			name: 'Track ID',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Track ID (integer)',
	// 					id: 'int',
	// 					default: 1,
	// 					regex: Regex.SIGNED_NUMBER,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const path = '/d3/showcontrol/trackid'
	// 				const int = await this.parseVariablesInString(event.options.int)

	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		cue: {
	// 			name: 'Cue',
	// 			options: [
	// 				{
	// 					type: 'number',
	// 					label: 'Cue (integer)',
	// 					id: 'int',
	// 					default: 1,
	// 					regex: Regex.SIGNED_NUMBER,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const path = '/d3/showcontrol/cue'
	// 				const int = await this.parseVariablesInString(event.options.int)

	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		floatcue: {
	// 			name: 'Float cue',
	// 			options: [
	// 				{
	// 					type: 'static-text',
	// 					label: '*** important ***',
	// 					id: 'important-line',
	// 					value:
	// 						'Requires xx.yy format in disguise tag value e.g. 1.1 entered here will only trigger disguise if cue is set to 01.10',
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Cue (float)',
	// 					id: 'float',
	// 					default: '1.1',
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const path = '/d3/showcontrol/floatcue'
	// 				const float = await this.parseVariablesInString(event.options.float)

	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		fadeup: {
	// 			name: 'Fade up',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/fadeup'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		fadedown: {
	// 			name: 'Fade down',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/fadedown'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		hold: {
	// 			name: 'Hold',
	// 			options: [],
	// 			callback: (action) => {
	// 				const path = '/d3/showcontrol/hold'

	// 				this.sendOscMessage(path, [])
	// 			},
	// 		},
	// 		increment_brightness: {
	// 			name: 'Increase brightness',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Step (float)',
	// 					id: 'float',
	// 					default: 0.01,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					id: 'press',
	// 					type: 'static-text',
	// 					label: 'Add Press action',
	// 					value: 'Internal: Button: Trigger press (~40ms delay, force press if pressed, this button)',
	// 				},
	// 				{
	// 					id: 'release',
	// 					type: 'static-text',
	// 					label: 'And Release action',
	// 					value: 'Internal: Actions: Abort delayed actions on a button (this button)',
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				const brightness = this.getVariableValue('brightness')
	// 				const new_brightness = utils.increment_float(brightness, float)
	// 				this.log('debug', `new_brightness === ${new_brightness}`)
	// 				const path = '/d3/showcontrol/brightness'
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(new_brightness),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		decrement_brightness: {
	// 			name: 'Decrease brightness',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Step (float)',
	// 					id: 'float',
	// 					default: 0.01,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					id: 'press',
	// 					type: 'static-text',
	// 					label: 'Add Press action',
	// 					value: 'Internal: Button: Trigger press (~40ms delay, force press if pressed, this button)',
	// 				},
	// 				{
	// 					id: 'release',
	// 					type: 'static-text',
	// 					label: 'And Release action',
	// 					value: 'Internal: Actions: Abort delayed actions on a button (this button)',
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				const brightness = this.getVariableValue('brightness')
	// 				const new_brightness = utils.decrement_float(brightness, float)
	// 				this.log('debug', `new_brightness === ${new_brightness}`)
	// 				const path = '/d3/showcontrol/brightness'
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(new_brightness),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		increment_volume: {
	// 			name: 'Increase volume',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Step (float)',
	// 					id: 'float',
	// 					default: 0.01,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					id: 'press',
	// 					type: 'static-text',
	// 					label: 'Add Press action',
	// 					value: 'Internal: Button: Trigger press (~40ms delay, force press if pressed, this button)',
	// 				},
	// 				{
	// 					id: 'release',
	// 					type: 'static-text',
	// 					label: 'And Release action',
	// 					value: 'Internal: Actions: Abort delayed actions on a button (this button)',
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				const volume = this.getVariableValue('volume')
	// 				const new_volume = utils.increment_float(volume, float)
	// 				// this.log('debug', `new_volume === ${new_volume}`)
	// 				const path = '/d3/showcontrol/volume'
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(new_volume),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		decrement_volume: {
	// 			name: 'Decrease volume',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Step (float)',
	// 					id: 'float',
	// 					default: 0.01,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					id: 'press',
	// 					type: 'static-text',
	// 					label: 'Add Press action',
	// 					value: 'Internal: Button: Trigger press (~40ms delay, force press if pressed, this button)',
	// 				},
	// 				{
	// 					id: 'release',
	// 					type: 'static-text',
	// 					label: 'And Release action',
	// 					value: 'Internal: Actions: Abort delayed actions on a button (this button)',
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				const volume = this.getVariableValue('volume')
	// 				const new_volume = utils.decrement_float(volume, float)
	// 				// this.log('debug', `new_volume === ${new_volume}`)
	// 				const path = '/d3/showcontrol/volume'
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(new_volume),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		// layer control actions
	// 		layer_blendmode: {
	// 			name: 'Layer blendmode',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'dropdown',
	// 					id: 'mode',
	// 					label: 'Blendmode :',
	// 					default: '00',
	// 					choices: choices.BLENDMODE,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/blendmode`
	// 				const int = await this.parseVariablesInString(event.options.mode)

	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_brightness: {
	// 			name: 'Layer brightness',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Brightness (float)',
	// 					id: 'float',
	// 					default: 1,
	// 					max: 1,
	// 					min: 0,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/brightness`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_tint: {
	// 			name: 'Layer tint',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'dropdown',
	// 					id: 'channel',
	// 					label: 'Channel :',
	// 					default: 'r',
	// 					choices: choices.TINT,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Tint (float)',
	// 					id: 'float',
	// 					default: 1,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const channel = await this.parseVariablesInString(event.options.channel)
	// 				const path = `${base_address}${layer}/tint.${channel}`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_speed: {
	// 			name: 'Layer speed',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Speed (int)',
	// 					id: 'int',
	// 					default: 0,
	// 					max: 4,
	// 					min: -4,
	// 					regex: Regex.SIGNED_NUMBER,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/speed`
	// 				const int = await this.parseVariablesInString(event.options.int)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_mode: {
	// 			name: 'Layer mode',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'dropdown',
	// 					id: 'int',
	// 					label: 'Mode :',
	// 					default: '1',
	// 					choices: choices.MODE,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const channel = await this.parseVariablesInString(event.options.channel)
	// 				const path = `${base_address}${layer}/mode`
	// 				const int = await this.parseVariablesInString(event.options.int)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_at_end_point: {
	// 			name: 'Layer at end point',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'dropdown',
	// 					id: 'int',
	// 					label: 'At end point :',
	// 					default: '0',
	// 					choices: choices.AT_END_POINT,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const channel = await this.parseVariablesInString(event.options.channel)
	// 				const path = `${base_address}${layer}/at_end_point`
	// 				const int = await this.parseVariablesInString(event.options.int)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_transition_time: {
	// 			name: 'Layer transition time',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Transition time (int) :',
	// 					id: 'int',
	// 					default: 0,
	// 					max: 10,
	// 					min: 0,
	// 					regex: Regex.SIGNED_NUMBER,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/transition_time`
	// 				const int = await this.parseVariablesInString(event.options.int)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'i',
	// 						value: parseInt(int),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_volume: {
	// 			name: 'Layer volume',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Volume (float) :',
	// 					id: 'float',
	// 					default: 1,
	// 					max: 1,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/volume`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_brightness_shift: {
	// 			name: 'Layer brightness (shift)',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Brightness (shift) (float) :',
	// 					id: 'float',
	// 					default: 0,
	// 					max: 1,
	// 					min: -1,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/brightness_(shift)`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_contrast_scale: {
	// 			name: 'Layer contrast scale',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Contrast scale (float) :',
	// 					id: 'float',
	// 					default: 1,
	// 					max: 2,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/contrast_(scale)`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 		layer_saturation_scale: {
	// 			name: 'Layer saturation scale',
	// 			options: [
	// 				{
	// 					type: 'textinput',
	// 					label: 'Base address :',
	// 					id: 'base_address',
	// 					default: layer_base_address,
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'textinput',
	// 					label: 'Layer name :',
	// 					id: 'layer_name',
	// 					default: 'video',
	// 					useVariables: true,
	// 				},
	// 				{
	// 					type: 'number',
	// 					label: 'Saturation scale (float) :',
	// 					id: 'float',
	// 					default: 1,
	// 					max: 4,
	// 					min: 0,
	// 					step: 0.01,
	// 					regex: Regex.SIGNED_FLOAT,
	// 					useVariables: true,
	// 				},
	// 			],
	// 			callback: async (event) => {
	// 				const base_address = await this.parseVariablesInString(event.options.base_address)
	// 				const layer = await this.parseVariablesInString(event.options.layer_name)
	// 				const path = `${base_address}${layer}/saturation_scale`
	// 				const float = await this.parseVariablesInString(event.options.float)
	// 				this.sendOscMessage(path, [
	// 					{
	// 						type: 'f',
	// 						value: parseFloat(float),
	// 					},
	// 				])
	// 			},
	// 		},
	// 	})
	// }
}

runEntrypoint(disguiseOSCInstance, UpgradeScripts)
