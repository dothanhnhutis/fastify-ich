SELECT *
FROM "User"
WHERE email = 'gaconght1@gmail.com';

INSERT INTO "User"(email, password_hash, username) VALUES('gaconght003@gmail.com','ádasd','nhut') RETURNING *;