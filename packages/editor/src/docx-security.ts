export function hasASCIIControlCharacter(value: string) {
  for (let index = 0; index < value.length; index++) {
    const character = value.charCodeAt(index)

    if (character < 0x20 || character === 0x7f) return true
  }

  return false
}

export function hasForbiddenURLCharacter(value: string) {
  return value.includes(" ") || hasASCIIControlCharacter(value)
}
