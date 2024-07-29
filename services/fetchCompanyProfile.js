const axios = require('axios');
const Stock = require('../models/Stock');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchCompanyProfile(symbol) {
    try {
        // Check if the company profile already exists in the database
        let stock = await Stock.findOne({ symbol: symbol });

        if (stock) {
            console.log(`Company profile for ${symbol} found in database.`);
            return stock;
        }

        // Fetch company profile from FMP
        const profileUrl = `${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
        const profileResponse = await axios.get(profileUrl);
        const profileData = profileResponse.data;

        if (!profileData || profileData.length === 0) {
            console.warn(`No profile data found for symbol ${symbol}`);
            return null;
        }

        // Save the profile data to the database
        const companyData = profileData[0];
        stock = new Stock({
            symbol: companyData.symbol,
            price: companyData.price,
            beta: companyData.beta,
            volAvg: companyData.volAvg,
            mktCap: companyData.mktCap,
            lastDiv: companyData.lastDiv,
            range: companyData.range,
            changes: companyData.changes,
            companyName: companyData.companyName,
            currency: companyData.currency,
            cik: companyData.cik,
            isin: companyData.isin,
            cusip: companyData.cusip,
            exchange: companyData.exchange,
            exchangeShortName: companyData.exchangeShortName,
            industry: companyData.industry,
            website: companyData.website,
            description: companyData.description,
            ceo: companyData.ceo,
            sector: companyData.sector,
            country: companyData.country,
            fullTimeEmployees: companyData.fullTimeEmployees,
            phone: companyData.phone,
            address: companyData.address,
            city: companyData.city,
            state: companyData.state,
            zip: companyData.zip,
            dcfDiff: companyData.dcfDiff,
            dcf: companyData.dcf,
            image: companyData.image,
            ipoDate: companyData.ipoDate,
            defaultImage: companyData.defaultImage,
            isEtf: companyData.isEtf,
            isActivelyTrading: companyData.isActivelyTrading,
            isAdr: companyData.isAdr,
            isFund: companyData.isFund,
            last_updated: new Date()
        });

        await stock.save();
        console.log(`Company profile for ${symbol} saved to database.`);

        const test = "Test string to see if tool works";

        //return stock;
        return test;

    } catch (error) {
        console.error(`Error fetching company profile for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
    fetchCompanyProfile
};