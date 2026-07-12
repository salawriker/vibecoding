import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

// 리드(잠재고객) 테이블: 이름, 이메일, 전화번호, 문의 내용을 수집합니다.
// message는 선택 입력이라 nullable(기존 리드에는 값이 없을 수 있음).
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

// 리드별 메모: 한 리드에 여러 개를 시간순으로 쌓을 수 있습니다(1:N).
// 리드가 삭제되면 딸린 메모도 함께 정리되도록 cascade를 겁니다.
export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LeadNote = typeof leadNotes.$inferSelect;
export type NewLeadNote = typeof leadNotes.$inferInsert;
