const innerPreset = {
  name: '@panda-test/chain-lib/inner-preset',
  theme: {
    extend: {
      tokens: {
        colors: {
          innerBrand: { value: '#112233' },
        },
      },
    },
  },
}

module.exports = {
  name: '@panda-test/chain-lib/preset',
  presets: [innerPreset],
  theme: {
    extend: {
      tokens: {
        colors: {
          chainBrand: { value: '#445566' },
        },
      },
    },
  },
}
