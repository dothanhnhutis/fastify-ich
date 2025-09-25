-- findPackagingTransactionById
SELECT
	pt.*,
	CASE 
		WHEN fw.id IS NOT NULL THEN 
			COALESCE(
				json_build_object(
					'id', fw.id,
					'name', fw.name,
					'address', fw.address
				)
			)
		ELSE NULL
		END
		AS from_warehouse,
	CASE 
		WHEN tw.id IS NOT NULL THEN 
			COALESCE(
				json_build_object(
					'id', tw.id,
					'name', tw.name,
					'address', tw.address
				)
			)
		ELSE NULL
		END
		AS to_warehouse,
	COUNT(pti.packaging_id) as item_count
FROM packaging_transactions pt
	LEFT JOIN warehouses fw ON pt.from_warehouse_id = fw.id
	LEFT JOIN warehouses tw ON pt.to_warehouse_id = tw.id
	LEFT JOIN packaging_transaction_items pti ON pti.packaging_transaction_id = pt.id
WHERE 
	pt.id = '996aaa9c-f374-46d0-9308-3aae5da4dab9'
GROUP BY 
	pt.id,
	fw.id,
	fw.name,
	fw.address,
	tw.id,
	tw.name,
	tw.address,
	pti.packaging_id;

-- findPackagingTransactionItemsByPTId
SELECT
	pt.*,
	COALESCE(
		json_agg(
			json_build_object(
				'packaging_id', pti.packaging_id,
				'warehouse_id', pti.warehouse_id,
				'quantity', pti.quantity,
				'signed_quantity', pti.signed_quantity,
				'created_at', to_char(pti.created_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
				'updated_at', to_char(pti.updated_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
			)
		),'[]'
	) AS items
FROM packaging_transactions pt
	LEFT JOIN packaging_transaction_items pti ON pti.packaging_transaction_id = pt.id
WHERE 
	pt.id = '996aaa9c-f374-46d0-9308-3aae5da4dab9'
GROUP BY 
	pt.id;

--
SELECT 
    pti.packaging_id,
    p.name AS packaging_name,
    pti.warehouse_id,
    fw.name AS from_warehouse_name,
    tw.name AS to_warehouse_name,
    pti.quantity,
    pti.created_at,
    pti.updated_at
FROM packaging_transaction_items pti
JOIN packagings p 
    ON p.id = pti.packaging_id
JOIN packaging_transactions pt 
    ON pt.id = pti.packaging_transaction_id
LEFT JOIN warehouses fw 
    ON fw.id = pt.from_warehouse_id
LEFT JOIN warehouses tw 
    ON tw.id = pt.to_warehouse_id
WHERE pti.packaging_transaction_id = '996aaa9c-f374-46d0-9308-3aae5da4dab9'