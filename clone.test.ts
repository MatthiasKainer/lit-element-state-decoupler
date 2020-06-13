import { shallowClone } from "./clone"

describe("shallowClone", () => {
    it("should correctly not handle primitives", () => {
        expect(shallowClone("bla")).toBe("bla")
        expect(shallowClone(42)).toBe(42)
        expect(shallowClone(true)).toBe(true)
        expect(shallowClone(false)).toBe(false)
        expect(shallowClone(0)).toBe(0)
    })
    it("should correctly not handle dates because damn they are evil", () => {
        const date = new Date(Date.now())
        expect(shallowClone(date)).toBe(date)
    })
    it("should correctly not handle regexes because how would it", () => {
        const reg = /blablub/gi
        expect(shallowClone(reg)).toBe(reg)
    })
    it("should not handle undefined and null objects", () => {
        expect(shallowClone(null)).toBe(null)
        expect(shallowClone(undefined)).toBe(undefined)
    })
    it("should shallow clone an object nicely", () => {
        const obj = { with: true, some: "fields" }
        expect(shallowClone(obj)).not.toBe(obj)
        expect(shallowClone(obj)).toEqual(obj)
    })    
    it("should shallow clone an array nicely", () => {
        const obj = ["a", "b"]
        expect(shallowClone(obj)).not.toBe(obj)
        expect(shallowClone(obj)).toEqual(obj)
    })
})