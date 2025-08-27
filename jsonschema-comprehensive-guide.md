# JSON Schema - Hướng dẫn toàn diện

## Mục lục
1. [Giới thiệu JSON Schema](#giới-thiệu-json-schema)
2. [Cú pháp cơ bản](#cú-pháp-cơ-bản)
3. [Các kiểu dữ liệu](#các-kiểu-dữ-liệu)
4. [Validation Keywords](#validation-keywords)
5. [Custom Error Messages](#custom-error-messages)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Tích hợp với Fastify](#tích-hợp-với-fastify)
9. [Tools và Libraries](#tools-và-libraries)

## Giới thiệu JSON Schema

JSON Schema là một vocabulary cho phép bạn annotate và validate JSON documents. Nó cung cấp:

- **Data validation**: Kiểm tra tính hợp lệ của dữ liệu
- **Documentation**: Mô tả cấu trúc dữ liệu
- **Code generation**: Tạo code từ schema
- **Testing**: Đảm bảo data consistency

### Các phiên bản phổ biến
- **Draft-07**: Được hỗ trợ rộng rãi
- **Draft 2019-09**: Phiên bản mới hơn
- **Draft 2020-12**: Phiên bản mới nhất

## Cú pháp cơ bản

### Schema đơn giản nhất
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object"
}
```

### Schema với metadata
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/user.schema.json",
  "title": "User Schema",
  "description": "Schema cho thông tin người dùng",
  "type": "object"
}
```

## Các kiểu dữ liệu

### 1. String
```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 100,
  "pattern": "^[a-zA-Z0-9]+$",
  "format": "email"
}
```

**Các format phổ biến:**
- `email`: Email address
- `date`: YYYY-MM-DD
- `date-time`: ISO 8601 datetime
- `uri`: URI
- `uuid`: UUID
- `ipv4`: IPv4 address
- `ipv6`: IPv6 address

### 2. Number/Integer
```json
{
  "type": "number",
  "minimum": 0,
  "maximum": 100,
  "exclusiveMinimum": 0,
  "exclusiveMaximum": 100,
  "multipleOf": 0.01
}
```

```json
{
  "type": "integer",
  "minimum": 1,
  "maximum": 10
}
```

### 3. Boolean
```json
{
  "type": "boolean"
}
```

### 4. Array
```json
{
  "type": "array",
  "items": {
    "type": "string"
  },
  "minItems": 1,
  "maxItems": 10,
  "uniqueItems": true
}
```

**Array với nhiều kiểu items:**
```json
{
  "type": "array",
  "prefixItems": [
    { "type": "string" },
    { "type": "number" },
    { "type": "boolean" }
  ],
  "items": false
}
```

### 5. Object
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

### 6. Null
```json
{
  "type": "null"
}
```

### 7. Mixed Types
```json
{
  "type": ["string", "number"]
}
```

## Validation Keywords

### Required Fields
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string" }
  },
  "required": ["name", "email"]
}
```

### Enum Values
```json
{
  "type": "string",
  "enum": ["red", "green", "blue"]
}
```

### Const Value
```json
{
  "type": "string",
  "const": "active"
}
```

### Pattern Properties
```json
{
  "type": "object",
  "patternProperties": {
    "^[a-zA-Z]+$": { "type": "string" },
    "^[0-9]+$": { "type": "number" }
  },
  "additionalProperties": false
}
```

### Additional Properties
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  },
  "additionalProperties": {
    "type": "string"
  }
}
```

## Custom Error Messages

### 1. Sử dụng errorMessage (AJV-errors)

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "errorMessage": {
        "type": "Tên phải là chuỗi ký tự",
        "minLength": "Tên không được để trống",
        "maxLength": "Tên không được quá 50 ký tự"
      }
    },
    "age": {
      "type": "integer",
      "minimum": 18,
      "maximum": 100,
      "errorMessage": {
        "type": "Tuổi phải là số nguyên",
        "minimum": "Tuổi phải từ 18 trở lên",
        "maximum": "Tuổi không được quá 100"
      }
    }
  },
  "required": ["name", "age"],
  "errorMessage": {
    "type": "Dữ liệu phải là object hợp lệ",
    "required": {
      "name": "Thiếu trường tên",
      "age": "Thiếu trường tuổi"
    }
  }
}
```

### 2. Template Messages
```json
{
  "type": "string",
  "minLength": 3,
  "maxLength": 20,
  "errorMessage": {
    "minLength": "Phải có ít nhất ${schema.minLength} ký tự",
    "maxLength": "Không được quá ${schema.maxLength} ký tự"
  }
}
```

### 3. Array Error Messages
```json
{
  "type": "array",
  "minItems": 1,
  "maxItems": 5,
  "items": {
    "type": "string",
    "minLength": 2,
    "errorMessage": {
      "type": "Mỗi phần tử phải là chuỗi ký tự",
      "minLength": "Mỗi phần tử phải có ít nhất 2 ký tự"
    }
  },
  "errorMessage": {
    "type": "Phải là mảng",
    "minItems": "Phải có ít nhất 1 phần tử",
    "maxItems": "Không được quá 5 phần tử"
  }
}
```

## Advanced Features

### 1. Conditional Validation
```json
{
  "type": "object",
  "properties": {
    "userType": {
      "type": "string",
      "enum": ["admin", "user"]
    },
    "permissions": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "if": {
    "properties": {
      "userType": { "const": "admin" }
    }
  },
  "then": {
    "properties": {
      "permissions": {
        "minItems": 1,
        "contains": { "const": "admin" }
      }
    }
  },
  "else": {
    "properties": {
      "permissions": {
        "maxItems": 3
      }
    }
  }
}
```

### 2. AllOf, AnyOf, OneOf
```json
{
  "allOf": [
    { "type": "object" },
    {
      "properties": {
        "name": { "type": "string" }
      }
    }
  ]
}
```

```json
{
  "anyOf": [
    { "type": "string" },
    { "type": "number" }
  ]
}
```

```json
{
  "oneOf": [
    {
      "properties": {
        "type": { "const": "email" },
        "email": { "format": "email" }
      }
    },
    {
      "properties": {
        "type": { "const": "phone" },
        "phone": { "pattern": "^[0-9]{10}$" }
      }
    }
  ]
}
```

### 3. Not
```json
{
  "not": {
    "type": "null"
  }
}
```

### 4. Definitions và References
```json
{
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      }
    }
  },
  "type": "object",
  "properties": {
    "homeAddress": { "$ref": "#/$defs/address" },
    "workAddress": { "$ref": "#/$defs/address" }
  }
}
```

### 5. Dependencies
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "credit_card": { "type": "number" },
    "billing_address": { "type": "string" }
  },
  "dependentRequired": {
    "credit_card": ["billing_address"]
  }
}
```

## Best Practices

### 1. Schema Organization
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/user.json",
  "title": "User",
  "description": "A user in the system",
  "type": "object",
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      },
      "required": ["street", "city"]
    }
  },
  "properties": {
    "name": {
      "type": "string",
      "description": "The user's full name"
    },
    "address": {
      "$ref": "#/$defs/address"
    }
  },
  "required": ["name"]
}
```

### 2. Error Handling Strategy
```typescript
// Centralized error message configuration
const ERROR_MESSAGES = {
  REQUIRED: "Trường này là bắt buộc",
  INVALID_FORMAT: "Định dạng không hợp lệ",
  TOO_SHORT: "Quá ngắn",
  TOO_LONG: "Quá dài"
};

// Schema với consistent error messages
const userSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      errorMessage: {
        type: ERROR_MESSAGES.REQUIRED,
        format: "Email không đúng định dạng"
      }
    }
  }
};
```

### 3. Performance Optimization
```typescript
// Compile schema một lần
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

// Reuse compiled validator
function validateData(data: any) {
  const valid = validate(data);
  if (!valid) {
    return validate.errors;
  }
  return null;
}
```

### 4. Schema Versioning
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/user/v2.json",
  "version": "2.0.0",
  "type": "object"
}
```

## Tích hợp với Fastify

### 1. Basic Setup
```typescript
import Fastify from 'fastify';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

const fastify = Fastify({
  ajv: {
    customOptions: {
      allErrors: true,
      removeAdditional: true
    },
    plugins: [addFormats, addErrors]
  }
});

const schema = {
  body: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        errorMessage: {
          type: "Tên phải là chuỗi",
          minLength: "Tên không được trống"
        }
      }
    },
    required: ["name"],
    errorMessage: {
      required: {
        name: "Thiếu trường tên"
      }
    }
  }
};

fastify.post('/users', { schema }, async (request, reply) => {
  return { success: true, data: request.body };
});
```

### 2. Custom Error Handler
```typescript
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    const errors = error.validation.map(err => ({
      field: err.instancePath.replace('/', '') || err.params?.missingProperty,
      message: err.message,
      value: err.data
    }));
    
    return reply.code(400).send({
      error: "Validation Error",
      details: errors
    });
  }
  
  reply.code(500).send({ error: "Internal Server Error" });
});
```

### 3. Schema Composition
```typescript
const baseUserSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" }
  },
  required: ["name", "email"]
};

const createUserSchema = {
  body: {
    ...baseUserSchema,
    properties: {
      ...baseUserSchema.properties,
      password: {
        type: "string",
        minLength: 8,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
      }
    },
    required: [...baseUserSchema.required, "password"]
  }
};

const updateUserSchema = {
  body: {
    ...baseUserSchema,
    required: [] // No required fields for update
  }
};
```

## Tools và Libraries

### 1. Validation Libraries
- **AJV**: Fastest JSON Schema validator
- **Joi**: Alternative schema validation library
- **Yup**: JavaScript schema builder
- **Zod**: TypeScript-first schema validation

### 2. AJV Plugins
```bash
npm install ajv ajv-formats ajv-errors ajv-keywords
```

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);
addKeywords(ajv);
```

### 3. Schema Generation Tools
- **quicktype**: Generate schemas from JSON
- **json-schema-generator**: Online schema generator
- **@apidevtools/json-schema-ref-parser**: Resolve $ref pointers

### 4. Testing Tools
```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = { type: "string", minLength: 5 };
const validate = ajv.compile(schema);

// Test cases
const testCases = [
  { data: "hello", expected: true },
  { data: "hi", expected: false },
  { data: 123, expected: false }
];

testCases.forEach(({ data, expected }) => {
  const result = validate(data);
  console.assert(result === expected, `Test failed for ${data}`);
});
```

### 5. Documentation Generation
```typescript
// Generate documentation from schema
function generateDocs(schema: any): string {
  let docs = `# ${schema.title || 'Schema'}\n\n`;
  
  if (schema.description) {
    docs += `${schema.description}\n\n`;
  }
  
  docs += '## Properties\n\n';
  
  for (const [prop, propSchema] of Object.entries(schema.properties || {})) {
    const ps = propSchema as any;
    docs += `### ${prop}\n`;
    docs += `- Type: ${ps.type}\n`;
    if (ps.description) docs += `- Description: ${ps.description}\n`;
    if (ps.format) docs += `- Format: ${ps.format}\n`;
    docs += '\n';
  }
  
  return docs;
}
```

## Examples thực tế

### 1. E-commerce Product Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Product",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^PROD-[0-9]{6}$",
      "errorMessage": {
        "pattern": "ID sản phẩm phải có định dạng PROD-123456"
      }
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "errorMessage": {
        "minLength": "Tên sản phẩm không được trống",
        "maxLength": "Tên sản phẩm không được quá 100 ký tự"
      }
    },
    "price": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 1000,
      "errorMessage": {
        "minimum": "Giá không được âm",
        "multipleOf": "Giá phải là bội số của 1000"
      }
    },
    "category": {
      "type": "string",
      "enum": ["electronics", "clothing", "books", "home"],
      "errorMessage": {
        "enum": "Danh mục phải là: electronics, clothing, books, hoặc home"
      }
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 2,
        "maxLength": 20
      },
      "minItems": 1,
      "maxItems": 10,
      "uniqueItems": true,
      "errorMessage": {
        "minItems": "Phải có ít nhất 1 tag",
        "maxItems": "Không được quá 10 tags",
        "uniqueItems": "Tags không được trùng lặp"
      }
    },
    "specifications": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z][a-zA-Z0-9_]*$": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        }
      },
      "additionalProperties": false,
      "minProperties": 1,
      "errorMessage": {
        "minProperties": "Phải có ít nhất 1 thông số kỹ thuật",
        "patternProperties": "Key thông số phải bắt đầu bằng chữ cái",
        "additionalProperties": "Chỉ được phép key theo quy định"
      }
    },
    "availability": {
      "type": "object",
      "properties": {
        "inStock": { "type": "boolean" },
        "quantity": {
          "type": "integer",
          "minimum": 0,
          "errorMessage": {
            "minimum": "Số lượng không được âm"
          }
        },
        "reservedQuantity": {
          "type": "integer",
          "minimum": 0,
          "errorMessage": {
            "minimum": "Số lượng đặt trước không được âm"
          }
        }
      },
      "required": ["inStock", "quantity"],
      "if": {
        "properties": { "inStock": { "const": true } }
      },
      "then": {
        "properties": {
          "quantity": { "minimum": 1 }
        },
        "errorMessage": {
          "properties": {
            "quantity": "Sản phẩm có sẵn phải có số lượng > 0"
          }
        }
      }
    }
  },
  "required": ["id", "name", "price", "category", "availability"],
  "additionalProperties": false,
  "errorMessage": {
    "required": {
      "id": "Thiếu ID sản phẩm",
      "name": "Thiếu tên sản phẩm",
      "price": "Thiếu giá sản phẩm",
      "category": "Thiếu danh mục",
      "availability": "Thiếu thông tin có sẵn"
    },
    "additionalProperties": "Chỉ được phép các trường đã định nghĩa"
  }
}
```

### 2. User Management Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "User Registration",
  "$defs": {
    "vietnamesePhoneNumber": {
      "type": "string",
      "pattern": "^(\\+84|0)[0-9]{9,10}$",
      "errorMessage": {
        "pattern": "Số điện thoại phải có định dạng Việt Nam"
      }
    },
    "strongPassword": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128,
      "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
      "errorMessage": {
        "minLength": "Mật khẩu phải có ít nhất 8 ký tự",
        "maxLength": "Mật khẩu không được quá 128 ký tự",
        "pattern": "Mật khẩu phải chứa: chữ thường, chữ hoa, số và ký tự đặc biệt"
      }
    }
  },
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 20,
      "pattern": "^[a-zA-Z0-9_]+$",
      "errorMessage": {
        "minLength": "Username phải có ít nhất 3 ký tự",
        "maxLength": "Username không được quá 20 ký tự",
        "pattern": "Username chỉ được chứa chữ cái, số và dấu gạch dưới"
      }
    },
    "email": {
      "type": "string",
      "format": "email",
      "errorMessage": {
        "format": "Email không đúng định dạng"
      }
    },
    "password": { "$ref": "#/$defs/strongPassword" },
    "confirmPassword": {
      "type": "string",
      "errorMessage": {
        "type": "Xác nhận mật khẩu không được trống"
      }
    },
    "profile": {
      "type": "object",
      "properties": {
        "firstName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50,
          "pattern": "^[a-zA-ZÀ-ỹ\\s]+$",
          "errorMessage": {
            "minLength": "Họ không được trống",
            "maxLength": "Họ không được quá 50 ký tự",
            "pattern": "Họ chỉ được chứa chữ cái và khoảng trắng"
          }
        },
        "lastName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50,
          "pattern": "^[a-zA-ZÀ-ỹ\\s]+$",
          "errorMessage": {
            "minLength": "Tên không được trống",
            "maxLength": "Tên không được quá 50 ký tự",
            "pattern": "Tên chỉ được chứa chữ cái và khoảng trắng"
          }
        },
        "birthDate": {
          "type": "string",
          "format": "date",
          "errorMessage": {
            "format": "Ngày sinh phải có định dạng YYYY-MM-DD"
          }
        },
        "phoneNumber": { "$ref": "#/$defs/vietnamesePhoneNumber" },
        "gender": {
          "type": "string",
          "enum": ["male", "female", "other"],
          "errorMessage": {
            "enum": "Giới tính phải là: male, female hoặc other"
          }
        }
      },
      "required": ["firstName", "lastName"],
      "errorMessage": {
        "required": {
          "firstName": "Thiếu họ",
          "lastName": "Thiếu tên"
        }
      }
    }
  },
  "required": ["username", "email", "password", "confirmPassword", "profile"],
  "properties": {
    "password": { "$ref": "#/$defs/strongPassword" },
    "confirmPassword": {
      "const": { "$data": "1/password" },
      "errorMessage": {
        "const": "Xác nhận mật khẩu không khớp"
      }
    }
  },
  "errorMessage": {
    "required": {
      "username": "Thiếu tên đăng nhập",
      "email": "Thiếu email",
      "password": "Thiếu mật khẩu",
      "confirmPassword": "Thiếu xác nhận mật khẩu",
      "profile": "Thiếu thông tin cá nhân"
    }
  }
}
```

## Kết luận

JSON Schema là một công cụ mạnh mẽ cho data validation và documentation. Key points:

1. **Bắt đầu đơn giản**: Dùng basic types trước, nâng cao dần
2. **Custom error messages**: Cải thiện UX với messages rõ ràng
3. **Performance**: Compile schema một lần, reuse nhiều lần
4. **Maintainability**: Tổ chức schema theo modules, sử dụng $ref
5. **Testing**: Test schema với nhiều test cases khác nhau

JSON Schema giúp đảm bảo data quality, improve developer experience và tạo ra robust APIs.