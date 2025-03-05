export class CollegeNameFormatter {
    static specialMappings: { [key: string]: string } = {
        'St': 'State',
        'Univ': 'University',
        'Inst': 'Institute',
        'Col': 'College',
        'Chr': 'Christian',
        'Intl': 'International',
        'Bap': 'Baptist',
        'Luth': 'Lutheran',
        'Naz': 'Nazarene',
        'Tech': 'Technology',
        'AK': 'Alaska',
        'AL': 'Alabama',
        'AR': 'Arkansas',
        'AZ': 'Arizona',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DC': 'District of Columbia',
        'Tx': 'Texas',
        'LA': 'Louisiana',
        'NY': 'New York',
        'PA': 'Pennsylvania',
        'OH': 'Ohio',
        'IL': 'Illinois',
        'NJ': 'New Jersey',
        'MA': 'Massachusetts',
        'NC': 'North Carolina',
        'SC': 'South Carolina',
        'ND': 'North Dakota',
        'SD': 'South Dakota',
        'MN': 'Minnesota',
        'GA': 'Georgia',
        'FL': 'Florida',
        'OK': 'Oklahoma'
    };

    static specialCases: { [key: string]: string } = {
        'usc': 'USC',
        'ucla': 'UCLA',
        'mit': 'MIT',
        'csu': 'CSU',
        'nyu': 'NYU',
        'suny': 'SUNY',
        'etsu': 'ETSU',
        'iupui': 'IUPUI',
        'umbc': 'UMBC',
        'unlv': 'UNLV',
        'utep': 'UTEP',
        'utrgv': 'UTRGV',
        'vcu': 'VCU',
        'wku': 'WKU'
    };

    static formatCollegeName(name:string) {
        // Replace specific known abbreviations
        Object.entries(this.specialMappings).forEach(([abbr, full]) => {
            const regex = new RegExp(`\\b${abbr}\\b`, 'g');
            name = name.replace(regex, full);
        });

        // Replace underscores with spaces
        name = name.replace(/_/g, ' ');

        // Handle ampersands
        name = name.replace(/\s&amp;\s/g, ' & ')
                   .replace(/\sand\s/g, ' & ');

        // Title case the name
        name = name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');

        // Check for special cases (exact match)
        const lowercaseName = name.toLowerCase();
        if (this.specialCases[lowercaseName]) {
            return this.specialCases[lowercaseName];
        }

        return name;
    }

	/*
    static createCollegeNameMapping(collegeList) {
        return collegeList.reduce((mapping, college) => {
            mapping[college] = this.formatCollegeName(college);
            return mapping;
        }, {});
    }
	*/
}

// Sample usage function
/*

function formatColleges(collegeList) {
    const collegeMapping = CollegeNameFormatter.createCollegeNameMapping(collegeList);
    
    // Print mapping to console
    Object.entries(collegeMapping).forEach(([original, formatted]) => {
        console.log(`${original}: ${formatted}`);
    });

    return collegeMapping;
}

// Example with a few colleges
const sampleColleges = [
    "Abilene_Chr",
    "Academy_of_Art",
    "Adams_St",
    "Adelphi",
    "Adrian",
    "Agnes_Scott",
    "Air_Force",
    "AK_Anchorage",
    "AK_Fairbanks",
    "Akron"
];

// Call the function with the sample list
const result = formatColleges(sampleColleges);

*/