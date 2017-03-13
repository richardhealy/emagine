// NOTES
// There should be 68 rocks on screen width wise 12 x 68 = 864
// There should be height / 25 + 10 

const Features = {
	originalGameWidth: 864,
    originalGameHeight: 600,
    speed: 1,
    maxHeight: 20,
    intervalIncrease: 5,
    playerSpeed: 6,
    usedStageRandomness: 1000,
    rockWidth:12,
    rockHeight:500,
    gridXSections: 68,
    gridYSections: 25,
    bgSpeed: 0.75,
    bufferCeiling: [],
    bufferFloor: [],
    ceiling: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    floor:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
};

export default Features;