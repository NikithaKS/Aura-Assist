{
  "name": "Person",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Person's name"
    },
    "relationship": {
      "type": "string",
      "description": "Relationship to user (family, friend, colleague, etc.)"
    },
    "photo_url": {
      "type": "string",
      "description": "Photo of the person for recognition"
    },
    "voice_description": {
      "type": "string",
      "description": "Audio description of the person"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes about the person"
    }
  },
  "required": [
    "name"
  ]
}
