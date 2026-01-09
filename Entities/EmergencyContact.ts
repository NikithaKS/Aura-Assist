{
  "name": "EmergencyContact",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Contact name"
    },
    "phone": {
      "type": "string",
      "description": "Phone number"
    },
    "relationship": {
      "type": "string",
      "description": "Relationship (family, caregiver, friend)"
    },
    "is_primary": {
      "type": "boolean",
      "description": "Primary emergency contact",
      "default": false
    }
  },
  "required": [
    "name",
    "phone"
  ]
}