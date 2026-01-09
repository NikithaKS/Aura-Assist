{
  "name": "SavedLocation",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Location name (Home, Work, etc.)"
    },
    "address": {
      "type": "string",
      "description": "Full address"
    },
    "latitude": {
      "type": "number",
      "description": "GPS latitude"
    },
    "longitude": {
      "type": "number",
      "description": "GPS longitude"
    },
    "notes": {
      "type": "string",
      "description": "Special notes or instructions"
    }
  },
  "required": [
    "name",
    "address"
  ]
}