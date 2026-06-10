import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool({host:'localhost', user:'root', password:'', database:'erp_facilite'});
  const [k] = await pool.query(`
      SELECT 
        pp.id AS projeto_id,
        pp.status AS projeto_status,
        pp.updated_at
      FROM projetos_producao pp
      INNER JOIN contrato_itens ci ON pp.contrato_item_id = ci.id
      INNER JOIN contratos ctr ON ci.contrato_id = ctr.id
      WHERE pp.deleted_at IS NULL 
        AND ci.deleted_at IS NULL 
        AND ctr.status = 'Ativo'
        AND (pp.status != 'Finalizado' OR pp.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY))
  `, [0]);
  console.log('Kanban Result for 0 days:', k);
  
  const [q] = await pool.query('SELECT NOW() as db_now');
  console.log('DB NOW:', q);
  
  process.exit(0);
}
run();
