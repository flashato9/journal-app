// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from "./meta/_journal.json";
import m0000 from "./0000_plain_dragon_man.sql";
import m0001 from "./0001_nice_shocker.sql";
import m0002 from "./0002_mighty_venom.sql";
import m0003 from "./0003_regular_pixie.sql";
import m0004 from "./0004_glamorous_masque.sql";
import m0005 from "./0005_long_donald_blake.sql";
import m0006 from "./0006_sudden_donald_blake.sql";
import m0007 from "./0007_migrate_settings_to_app_settings.sql";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
  },
};
