import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// 리드(잠재고객) 테이블: 이름, 이메일, 전화번호를 수집합니다.
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
