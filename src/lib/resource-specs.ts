import type {
  ResourceDto,
  ResourceTypeDto,
  SpecificationDataType,
  SpecificationDefinition,
} from "@/types/api"

type SpecificationValue = string | number | boolean

export function coerceSpecificationValue(
  value: string,
  dataType: SpecificationDataType
): SpecificationValue {
  if (dataType === "NUMBER") {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : value
  }

  if (dataType === "BOOLEAN") {
    return value === "true"
  }

  return value
}

export function specificationInputValue(
  value: SpecificationValue | undefined
) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value)
}

export function buildSpecificationValues(
  definitions: SpecificationDefinition[],
  values: Record<string, string>
) {
  return definitions.reduce<Record<string, SpecificationValue>>(
    (result, definition) => {
      const value = values[definition.name]
      if (value !== undefined && value !== "") {
        result[definition.name] = coerceSpecificationValue(
          value,
          definition.dataType
        )
      }
      return result
    },
    {}
  )
}

export function missingRequiredSpecifications(
  definitions: SpecificationDefinition[],
  values: Record<string, string>
) {
  return definitions.filter(
    (definition) => definition.required && !values[definition.name]
  )
}

export function resourceSpecificationEntries(
  resource: ResourceDto,
  resourceType?: ResourceTypeDto
) {
  const values = resource.specificationValues ?? {}

  if (resourceType?.specificationDefinitions.length) {
    return resourceType.specificationDefinitions.map((definition) => ({
      name: definition.name,
      label: definition.label || definition.name,
      value: values[definition.name],
    }))
  }

  return Object.entries(values).map(([name, value]) => ({
    name,
    label: name,
    value,
  }))
}
