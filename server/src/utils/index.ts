import axios from 'axios';

export async function getSolanaPriceBinance(symbol = 'SOLUSDT') {
  try {
      // Binance API endpoint for ticker price
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`;
      
      const response = await axios.get(url);
      const { price, symbol: tradingPair } = response.data;

      return {
          price: parseFloat(price),
          symbol: tradingPair,
          timestamp: Date.now()
      };
  } catch (error) {
      console.error('Error fetching Solana price from Binance:', error);
      return null;
  }
}

export const getSOLPrice = async () => {
    // try {
    //     const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
    //     const { solana } = response.data;
    //     console.log("--------sol price-------------------", solana);
    //     return solana?.usd as number
    // } catch (error: any) {
    //     console.log(`getSOLPrice error - 1: `, error?.response?.data || error?.message || error);
    //     // return 150
    // }

    try {
        let sol_price = Number((await getSolanaPriceBinance())?.price);
        console.log("--------sol price from binance-------------------", sol_price);
        return sol_price;
    } catch (error:any) {
        console.log(`getSOLPrice error - 2: `, error);
    }

    return 180
    // const data: any = await birdeyeAPI.getTokenPriceInfo_Birdeye(uniconst.WSOL_ADDRESS.toString())
    // let cur_price: number = 0
    // if(data && data.value) cur_price = data.value
    // return cur_price
}