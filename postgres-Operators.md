# PostgreSQL Operators Cheat Sheet

---

## 🔹 1. Comparison Operators (So sánh cơ bản)

| Operator             | Meaning                         |
| -------------------- | ------------------------------- |
| `=`                  | equal to                        |
| `!=`, `<>`           | not equal                       |
| `<`, `>`, `<=`, `>=` | less than / greater than        |
| `BETWEEN A AND B`    | between A and B (inclusive)     |
| `LIKE`               | string match (case sensitive)   |
| `ILIKE`              | string match (case insensitive) |
| `IN (...)`           | value is in list                |
| `NOT IN (...)`       | value is not in list            |

---

## 🔹 2. Logical Operators

| Operator | Meaning     |
| -------- | ----------- |
| `AND`    | logical AND |
| `OR`     | logical OR  |
| `NOT`    | logical NOT |

---

## 🔹 3. String Operators

| Operator         | Meaning          | Example           |
| ---------------- | ---------------- | ----------------- | ----------- | ---- | --- | ----------- |
| `                |                  | `                 | concatenate | `'a' |     | 'b' → 'ab'` |
| `LIKE` / `ILIKE` | pattern matching | `'abc' LIKE 'a%'` |

---

## 🔹 4. Array Operators

| Operator                 | Meaning                                             |
| ------------------------ | --------------------------------------------------- |
| `@>`                     | left array **contains all** elements of right array |
| `<@`                     | left array is **contained in** right array          |
| `&&`                     | arrays have **any element in common** (overlap)     |
| `= ANY(...)`             | equivalent to `IN`                                  |
| `!= ALL(...)`            | equivalent to `NOT IN`                              |
| `array_length(arr, dim)` | length of array along dimension                     |

---

## 🔹 5. JSON / JSONB Operators

| Operator | Description                                      |
| -------- | ------------------------------------------------ | ------------------------------------------------ |
| `->`     | get JSON field (returns JSON)                    |
| `->>`    | get JSON field (returns TEXT)                    |
| `#>>`    | get field by path (nested) as TEXT               |
| `@>`     | left JSON contains right JSON (JSONB only)       |
| `?`      | does key/element exist in JSON object or array   |
| `?       | `                                                | contains **any of** the listed keys (array form) |
| `?&`     | contains **all of** the listed keys (array form) |

---

## 🔹 6. Full-Text Search Operators

| Operator | Meaning                     |
| -------- | --------------------------- | --- | --------------------- |
| `@@`     | does tsvector match tsquery |
| `        |                             | `   | concatenate tsvectors |

---

## 🔹 7. Math Operators

| Operator | Meaning        |
| -------- | -------------- |
| `+`      | addition       |
| `-`      | subtraction    |
| `*`      | multiplication |
| `/`      | division       |
| `%`      | modulus        |

---

## 🔹 8. Bitwise Operators

| Operator | Meaning     |
| -------- | ----------- | ---------- |
| `&`      | bitwise AND |
| `        | `           | bitwise OR |
| `#`      | bitwise XOR |
| `<<`     | left shift  |
| `>>`     | right shift |

---

## 🔹 9. Pattern Matching Operators

| Operator        | Meaning                          |
| --------------- | -------------------------------- |
| `LIKE`, `ILIKE` | `%` wildcard and `_` wildcard    |
| `~`             | matches POSIX regular expression |
| `~*`            | case-insensitive regex match     |
| `!~`            | does not match regex             |
| `!~*`           | case-insensitive not-match regex |

---

## 🔸 Tip

You can always check available operators for any data type via:

```sql
SELECT * FROM pg_catalog.pg_operator;
```
