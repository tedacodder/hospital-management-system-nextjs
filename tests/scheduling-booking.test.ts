import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/api";

// The Prisma client is mocked rather than hitting a real database — these
// tests exercise the booking rules (working hours, collisions), not Prisma
// itself. `vi.hoisted` runs before the `vi.mock` factory below, which Vitest
// requires for any value the factory closes over.
const mocks = vi.hoisted(() => ({
  doctorFindUnique: vi.fn(),
  availabilityFindMany: vi.fn(),
  appointmentFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    doctor: { findUnique: mocks.doctorFindUnique },
    doctorAvailability: { findMany: mocks.availabilityFindMany },
    appointment: { findMany: mocks.appointmentFindMany },
  },
}));

const { assertSlotIsBookable } = await import("@/lib/scheduling");

const TUESDAY = new Date("2026-09-15T10:00:00"); // a Tuesday, per the task's stated "current date"

beforeEach(() => {
  vi.clearAllMocks();
  mocks.doctorFindUnique.mockResolvedValue({ id: 1, isAcceptingNew: true });
  mocks.appointmentFindMany.mockResolvedValue([]);
});

describe("assertSlotIsBookable", () => {
  it("throws 404 when the doctor does not exist", async () => {
    mocks.doctorFindUnique.mockResolvedValue(null);
    mocks.availabilityFindMany.mockResolvedValue([]);

    await expect(assertSlotIsBookable(999, TUESDAY, 30)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>);
  });

  it("allows any time when the doctor has configured no hours at all", async () => {
    // A doctor with zero DoctorAvailability rows is treated as open, so
    // upgrading an existing deployment doesn't lock out every booking until
    // someone fills in hours.
    mocks.availabilityFindMany.mockResolvedValue([]);
    await expect(assertSlotIsBookable(1, TUESDAY, 30)).resolves.toBeUndefined();
  });

  it("allows a slot inside a configured window", async () => {
    mocks.availabilityFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);
    await expect(assertSlotIsBookable(1, TUESDAY, 30)).resolves.toBeUndefined();
  });

  it("rejects a slot outside every configured window", async () => {
    mocks.availabilityFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "12:00" },
    ]);
    // TUESDAY is 10:00, well inside 9-12, so push it to the afternoon instead.
    const afternoon = new Date("2026-09-15T15:00:00");

    await expect(assertSlotIsBookable(1, afternoon, 30)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("rejects a slot that would run past the end of the window", async () => {
    mocks.availabilityFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "10:15" },
    ]);
    // Starts inside the window but a 30-minute appointment ends at 10:30,
    // past the 10:15 close.
    await expect(assertSlotIsBookable(1, TUESDAY, 30)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("rejects a slot that collides with an existing appointment", async () => {
    mocks.availabilityFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);
    mocks.appointmentFindMany.mockResolvedValue([
      { date: TUESDAY, durationMinutes: 30 },
    ]);

    await expect(assertSlotIsBookable(1, TUESDAY, 30)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("ignores the appointment being rescheduled when checking collisions", async () => {
    mocks.availabilityFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);
    // The mock doesn't model NOT/exclusion filtering itself — it just returns
    // what the "database" would return once that filter is applied server-side.
    // This test documents that assertSlotIsBookable passes ignoreAppointmentId
    // through rather than dropping it silently.
    mocks.appointmentFindMany.mockResolvedValue([]);

    await assertSlotIsBookable(1, TUESDAY, 30, 42);

    const whereArg = mocks.appointmentFindMany.mock.calls[0][0].where;
    expect(whereArg.NOT).toEqual({ id: 42 });
  });
});
