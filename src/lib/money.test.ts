import { describe, expect, it } from "vitest";
import { toMinor, toMajor, parseMoneyInput, formatMoneyInput } from "./money";

describe("money conversion", () => {
	it("converts major to minor units", () => {
		expect(toMinor(100)).toBe(10000n);
		expect(toMinor(0.01)).toBe(1n);
		expect(toMinor(0)).toBe(0n);
	});

	it("handles the IEEE-754 rounding trap", () => {
		// 19.99 * 100 === 1998.9999999999998 — must not truncate to 1998.
		expect(toMinor(19.99)).toBe(1999n);
		expect(toMinor(0.29)).toBe(29n);
	});

	it("is limited by float representability of the INPUT", () => {
		// 1.005 is actually stored as 1.00499999…, so it rounds DOWN to 100 (₦1.00),
		// not 101. Nothing downstream can recover precision the number literal never
		// had — this is a limit of taking a float from the form, not of toMinor.
		expect(toMinor(1.005)).toBe(100n);
	});

	it("converts minor back to major", () => {
		expect(toMajor(10000n)).toBe(100);
		expect(toMajor(1n)).toBe(0.01);
		expect(toMajor(1999n)).toBe(19.99);
	});

	it("round-trips representative values", () => {
		for (const major of [0, 0.01, 19.99, 100, 214000, 1234567.89]) {
			expect(toMajor(toMinor(major))).toBeCloseTo(major, 2);
		}
	});

	it("handles large values beyond 32-bit Int range", () => {
		const large = 5_000_000_000; // ₦5bn, well past Int's ~₦21.4M cap
		expect(toMajor(toMinor(large))).toBe(large);
	});

	it("rejects non-finite input", () => {
		expect(() => toMinor(Infinity)).toThrow();
		expect(() => toMinor(NaN)).toThrow();
	});
});

describe("parseMoneyInput", () => {
	it("keeps thousands separators intact (the 300,000 bug)", () => {
		// The whole point: three hundred THOUSAND, not three hundred.
		expect(parseMoneyInput("300,000")).toBe(300000);
		expect(parseMoneyInput("1,250.50")).toBe(1250.5);
		expect(parseMoneyInput("₦1,000")).toBe(1000);
	});

	it("parses plain and decimal values", () => {
		expect(parseMoneyInput("500")).toBe(500);
		expect(parseMoneyInput("19.99")).toBe(19.99);
		expect(parseMoneyInput(" 42 ")).toBe(42);
	});

	it("returns NaN for junk so callers still validate", () => {
		expect(parseMoneyInput("")).toBeNaN();
		expect(parseMoneyInput("abc")).toBeNaN();
		expect(parseMoneyInput("1.2.3")).toBeNaN();
	});
});

describe("formatMoneyInput", () => {
	it("groups the integer part as you type", () => {
		expect(formatMoneyInput("300000")).toBe("300,000");
		expect(formatMoneyInput("1000000")).toBe("1,000,000");
	});

	it("preserves an in-progress decimal", () => {
		expect(formatMoneyInput("1250.5")).toBe("1,250.5");
		expect(formatMoneyInput("100.")).toBe("100.");
	});

	it("is idempotent on already-grouped input", () => {
		expect(formatMoneyInput("300,000")).toBe("300,000");
	});

	it("drops letters and stray symbols so only numbers survive", () => {
		expect(formatMoneyInput("12a3")).toBe("123");
		expect(formatMoneyInput("abc")).toBe("");
		expect(formatMoneyInput("1.2.3")).toBe("1.23");
		expect(formatMoneyInput("50k")).toBe("50");
	});
});
