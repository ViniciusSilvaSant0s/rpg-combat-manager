import { app } from './app.js';
import { initializeOraclePool, closeOraclePool } from './oracle-pool.js';

const port = Number(process.env.PORT ?? 3000);

void initializeOraclePool().catch(() => console.error('Não foi possível iniciar o pool Oracle; uma nova tentativa será feita na próxima requisição.'));

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      void closeOraclePool().catch(() => console.error('Não foi possível encerrar o pool Oracle.')).finally(() => process.exit());
    });
  });
}
