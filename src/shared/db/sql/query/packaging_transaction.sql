-- findPackagingTransactionById
SELECT
	pt.*,
	CASE
		WHEN fw.id IS NOT NULL THEN COALESCE(
			json_build_object (
				'id',
				fw.id,
				'name',
				fw.name,
				'address',
				fw.address
			)
		)
		ELSE NULL
	END AS from_warehouse,
	CASE
		WHEN tw.id IS NOT NULL THEN COALESCE(
			json_build_object (
				'id',
				tw.id,
				'name',
				tw.name,
				'address',
				tw.address
			)
		)
		ELSE NULL
	END AS to_warehouse,
	COUNT(pti.packaging_id) as item_count
FROM
	packaging_transactions pt
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
	pti.packaging_id,
	pk.name,
	pti.quantity,
	json_build_object (
		'id',
		fw.id,
		'name',
		fw.name,
		'address',
		fw.address,
		'quantity',
		MAX(pti.signed_quantity) FILTER (
			WHERE
				warehouse_id = fw.id
		)
	) AS from_warehouse,
	CASE
		WHEN tw.id IS NOT NULL THEN json_build_object (
			'id',
			tw.id,
			'name',
			tw.name,
			'address',
			tw.address,
			'quantity',
			MAX(pti.signed_quantity) FILTER (
				WHERE
					warehouse_id = tw.id
			)
		)
		ELSE null
	END AS to_warehouse,
	pti.created_at,
	pti.updated_at
FROM
	packaging_transaction_items pti
	LEFT JOIN packagings pk on pk.id = pti.packaging_id
	LEFT JOIN packaging_transactions pt on pti.packaging_transaction_id = pt.id
	LEFT JOIN warehouses fw on pt.from_warehouse_id = fw.id
	LEFT JOIN warehouses tw on pt.to_warehouse_id = tw.id
WHERE
	pti.packaging_transaction_id = '76f07767-71da-4627-bbf5-7c323fb1f83c'
GROUP BY
	pti.packaging_transaction_id,
	pti.packaging_id,
	pti.quantity,
	pti.created_at,
	pti.updated_at,
	pt.type,
	pt.from_warehouse_id,
	pt.to_warehouse_id,
	pk.name,
	fw.id,
	fw.name,
	fw.address,
	tw.id,
	tw.name,
	tw.address;

--
SELECT
	pti.packaging_id,
	pk.name,
	pti.quantity,
	json_build_object (
		'id',
		fw.id,
		'name',
		fw.name,
		'address',
		fw.address,
		'quantity',
		MAX(pti.signed_quantity) FILTER (
			WHERE
				warehouse_id = fw.id
		)
	) AS from_warehouse,
	CASE
		WHEN tw.id IS NOT NULL THEN json_build_object (
			'id',
			tw.id,
			'name',
			tw.name,
			'address',
			tw.address,
			'quantity',
			MAX(pti.signed_quantity) FILTER (
				WHERE
					warehouse_id = tw.id
			)
		)
		ELSE null
	END AS to_warehouse,
	pti.created_at,
	pti.updated_at
FROM
	packaging_transaction_items pti
	LEFT JOIN packagings pk on pk.id = pti.packaging_id
	LEFT JOIN packaging_transactions pt on pti.packaging_transaction_id = pt.id
	LEFT JOIN warehouses fw on pt.from_warehouse_id = fw.id
	LEFT JOIN warehouses tw on pt.to_warehouse_id = tw.id
WHERE
	pti.packaging_transaction_id = '01998633-9f8e-73bf-b496-f67c69b175c6'
GROUP BY
	pti.packaging_transaction_id,
	pti.packaging_id,
	pti.quantity,
	pti.created_at,
	pti.updated_at,
	pt.type,
	pt.from_warehouse_id,
	pt.to_warehouse_id,
	pk.name,
	fw.id,
	fw.name,
	fw.address,
	tw.id,
	tw.name,
	tw.address;