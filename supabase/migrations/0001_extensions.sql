-- Extensions required by LayerFarm
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_cron;    -- missing-report scheduled check
