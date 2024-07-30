const axios = require('axios');
const Stock = require('../models/Stock');
require('dotenv').config();
const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchCompanyProfile(symbol) {
  try {
    // Check if the company profile already exists in the database
    let stock = await Stock.findOne({ symbol: symbol }, {
      symbol: 1,
      companyName: 1,
      currency: 1,
      cik: 1,
      isin: 1,
      cusip: 1,
      exchange: 1,
      exchangeShortName: 1,
      industry: 1,
      website: 1,
      description: 1,
      ceo: 1,
      sector: 1,
      country: 1,
      fullTimeEmployees: 1,
      phone: 1,
      address: 1,
      city: 1,
      state: 1,
      zip: 1,
      image: 1,
      ipoDate: 1,
      isEtf: 1,
      isActivelyTrading: 1,
      isAdr: 1,
      isFund: 1,
      last_updated: 1
    });

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

    // Extract only the company profile data
    const companyData = profileData[0];
    const profileFields = {
      symbol: companyData.symbol,
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
      image: companyData.image,
      ipoDate: companyData.ipoDate,
      isEtf: companyData.isEtf,
      isActivelyTrading: companyData.isActivelyTrading,
      isAdr: companyData.isAdr,
      isFund: companyData.isFund,
      last_updated: new Date()
    };

    // Save the profile data to the database
    stock = await Stock.findOneAndUpdate(
      { symbol: symbol },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Company profile for ${symbol} saved to database.`);
    return stock;
  } catch (error) {
    console.error(`Error fetching company profile for ${symbol}:`, error);
    return null;
  }
}

module.exports = {
  fetchCompanyProfile
};