export function configure(config) {
  config.globalResources([
  	'./value-converters/DifficultySettingConverter',
  	'./value-converters/StarDensityConverter',
  	'./value-converters/GalaxyAgeConverter',
  	'./value-converters/idealplanetsize',
  	'./value-converters/MinMaxConverter',
  	'./value-converters/percent',
  	'./value-converters/round',
  	'./value-converters/sqrt',
  	'./value-converters/objprops',
  	'./value-converters/uppercase',
  	'./value-converters/uppercaseFirst',
  	'./value-converters/LoveNubConverter',
  	'./value-converters/AnnoyometerConverter',
  	'./value-converters/CommunicationAbility',
  	]);
}
