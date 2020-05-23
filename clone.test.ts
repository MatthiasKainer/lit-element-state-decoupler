import { shallowClone, shallowMerge } from "./clone"

describe("shallowClone", () => {
    it("should correctly not handle primitives", () => {
        expect(shallowClone("bla")).toBe("bla")
        expect(shallowClone(42)).toBe(42)
        expect(shallowClone(true)).toBe(true)
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
})
describe("shallowMerge", () => {
    it("should correctly not handle primitives", () => {
        expect(shallowMerge("blub", "bla")).toBe("bla")
        expect(shallowMerge(24, 42)).toBe(42)
        expect(shallowMerge(false, true)).toBe(true)
    })
    it("should correctly just overwrite dates because damn they are evil", () => {
        const date1 = new Date()
        const date2 = new Date(Date.now())
        expect(shallowMerge(date1, date2)).toBe(date2)
        expect(shallowMerge(date1, "blub")).toBe("blub")
    })
    it("should correctly just overwrite regexes because how would it", () => {
        const reg1 = /blablub/gi
        const reg2 = /blibabu/gi
        expect(shallowMerge(reg1, reg2)).toBe(reg2)
        expect(shallowMerge(reg1, "blub")).toBe("blub")
    })
    it("should not handle undefined and null objects", () => {
        expect(shallowMerge(null, null)).toBe(null)
        const newObject = {}
        expect(shallowMerge(null, newObject)).not.toBe(newObject)
        expect(shallowMerge(null, newObject)).toEqual(newObject)
        expect(shallowMerge(undefined, undefined)).toBe(undefined)
        expect(shallowMerge(undefined, newObject)).not.toBe(newObject)
        expect(shallowMerge(undefined, newObject)).toEqual(newObject)
    })
    it("should merge an object nicely", () => {
        const obj = { with: true, some: "fields" }
        const newObject = { with: false, additional: "field" }
        expect(shallowMerge(obj, newObject)).not.toBe(obj)
        expect(shallowMerge(obj, newObject)).not.toBe(newObject)
        expect(shallowMerge(obj, newObject)).toEqual({...obj, ...newObject})
    })
})