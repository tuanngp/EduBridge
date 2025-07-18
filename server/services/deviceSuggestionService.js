import supabase from '../config/supabase.js';

/**
 * Calculate match score between a device and a need
 * @param {Object} device - Device object
 * @param {Object} need - Need object
 * @returns {Number} - Match score (0-100)
 */
export const calculateMatchScore = (device, need) => {
    let score = 0;

    // Match device type (most important factor)
    if (device.device_type === need.device_type) {
        score += 60;
    } else {
        // Check for similar device types (e.g., "Laptop" vs "Notebook")
        const deviceTypeLower = device.device_type.toLowerCase();
        const needTypeLower = need.device_type.toLowerCase();

        const laptopKeywords = ['laptop', 'notebook', 'macbook', 'thinkpad'];
        const desktopKeywords = ['desktop', 'pc', 'computer', 'tower'];
        const tabletKeywords = ['tablet', 'ipad', 'surface'];
        const phoneKeywords = ['phone', 'smartphone', 'mobile'];
        const monitorKeywords = ['monitor', 'display', 'screen'];
        const printerKeywords = ['printer', 'scanner'];
        const projectorKeywords = ['projector', 'beamer'];

        const isDeviceLaptop = laptopKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedLaptop = laptopKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDeviceDesktop = desktopKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedDesktop = desktopKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDeviceTablet = tabletKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedTablet = tabletKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDevicePhone = phoneKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedPhone = phoneKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDeviceMonitor = monitorKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedMonitor = monitorKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDevicePrinter = printerKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedPrinter = printerKeywords.some(keyword => needTypeLower.includes(keyword));

        const isDeviceProjector = projectorKeywords.some(keyword => deviceTypeLower.includes(keyword));
        const isNeedProjector = projectorKeywords.some(keyword => needTypeLower.includes(keyword));

        if (
            (isDeviceLaptop && isNeedLaptop) ||
            (isDeviceDesktop && isNeedDesktop) ||
            (isDeviceTablet && isNeedTablet) ||
            (isDevicePhone && isNeedPhone) ||
            (isDeviceMonitor && isNeedMonitor) ||
            (isDevicePrinter && isNeedPrinter) ||
            (isDeviceProjector && isNeedProjector)
        ) {
            score += 40;
        }
    }

    // Match condition
    // Better condition than requested is good, worse condition is bad
    const conditionValues = {
        'new': 3,
        'used-good': 2,
        'used-fair': 1
    };

    const deviceConditionValue = conditionValues[device.condition] || 1;

    // If need has a minimum condition specified
    if (need.min_condition) {
        const needConditionValue = conditionValues[need.min_condition] || 1;

        if (deviceConditionValue >= needConditionValue) {
            score += 15;
        } else {
            score -= 20; // Penalize if condition is worse than minimum required
        }
    } else {
        // If no minimum condition specified, better condition gets higher score
        score += deviceConditionValue * 5;
    }

    // Match specifications if available
    if (device.specifications && need.specifications) {
        try {
            const deviceSpecs = typeof device.specifications === 'string'
                ? JSON.parse(device.specifications)
                : device.specifications;

            const needSpecs = typeof need.specifications === 'string'
                ? JSON.parse(need.specifications)
                : need.specifications;

            // Match RAM
            if (deviceSpecs.RAM && needSpecs.RAM) {
                const deviceRAM = parseInt(deviceSpecs.RAM.match(/\d+/)[0]);
                const needRAM = parseInt(needSpecs.RAM.match(/\d+/)[0]);

                if (deviceRAM >= needRAM) {
                    score += 10;
                }
            }

            // Match Storage
            if (deviceSpecs.Storage && needSpecs.Storage) {
                const deviceStorage = parseInt(deviceSpecs.Storage.match(/\d+/)[0]);
                const needStorage = parseInt(needSpecs.Storage.match(/\d+/)[0]);

                if (deviceStorage >= needStorage) {
                    score += 10;
                }
            }

            // Match Processor
            if (deviceSpecs.Processor && needSpecs.Processor &&
                deviceSpecs.Processor.toLowerCase() === needSpecs.Processor.toLowerCase()) {
                score += 5;
            }

            // Match Operating System
            if (deviceSpecs['Operating System'] && needSpecs['Operating System'] &&
                deviceSpecs['Operating System'].toLowerCase().includes(needSpecs['Operating System'].toLowerCase())) {
                score += 5;
            }
        } catch (e) {
            // Ignore specification matching errors
            console.error('Error matching specifications:', e);
        }
    }

    // Match quantity
    if (device.quantity >= need.quantity) {
        score += 10;
    } else {
        // Partial match is still valuable
        score += 5 * (device.quantity / need.quantity);
    }

    // Adjust score based on need priority
    switch (need.priority) {
        case 'urgent':
            score += 10;
            break;
        case 'high':
            score += 7;
            break;
        case 'medium':
            score += 5;
            break;
        case 'low':
            score += 2;
            break;
    }

    // Cap score at 100
    return Math.min(100, Math.max(0, score));
};

/**
 * Find devices that match a specific need
 * @param {Object} need - Need object
 * @param {Number} limit - Maximum number of suggestions to return
 * @returns {Array} - Array of matching devices with scores
 */
export const findMatchingDevices = async (need, limit = 10) => {
    try {
        // Get all approved devices
        const { data: devices, error } = await supabase
            .from('devices')
            .select(`
        *,
        donors(organization, phone),
        users!donors.user_id(name, email)
      `)
            .eq('status', 'approved')
            .eq('users.is_verified', true);

        if (error || !devices) {
            console.error('Error fetching devices:', error);
            return [];
        }

        // Calculate match scores for each device
        const devicesWithScores = devices.map(device => {
            const matchScore = calculateMatchScore(device, need);
            return {
                ...device,
                matchScore
            };
        });

        // Sort by match score (higher is better)
        const sortedDevices = devicesWithScores.sort((a, b) => b.matchScore - a.matchScore);

        // Return top N results
        return sortedDevices.slice(0, limit);
    } catch (error) {
        console.error('Error finding matching devices:', error);
        return [];
    }
};

/**
 * Find devices that match a school's needs
 * @param {String} schoolId - School ID
 * @param {Number} limit - Maximum number of suggestions per need
 * @returns {Object} - Object with needs and matching devices
 */
export const findDevicesForSchoolNeeds = async (schoolId, limit = 5) => {
    try {
        // Get school's active needs
        const { data: needs, error: needsError } = await supabase
            .from('needs')
            .select('*')
            .eq('school_id', schoolId)
            .in('status', ['pending', 'approved']);

        if (needsError || !needs || needs.length === 0) {
            console.error('Error fetching school needs:', needsError);
            return { needs: [], matchingDevices: {} };
        }

        // Find matching devices for each need
        const matchingDevices = {};

        for (const need of needs) {
            const matches = await findMatchingDevices(need, limit);
            matchingDevices[need.id] = matches;
        }

        return {
            needs,
            matchingDevices
        };
    } catch (error) {
        console.error('Error finding devices for school needs:', error);
        return { needs: [], matchingDevices: {} };
    }
};