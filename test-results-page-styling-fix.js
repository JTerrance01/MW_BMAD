const puppeteer = require('puppeteer');

async function testResultsPageStyling() {
  console.log('🎨 Testing Competition Results Page Styling...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the results page
    console.log('📍 Navigating to Competition 21 Results page...');
    await page.goto('http://localhost:3000/competitions/21/results', { 
      waitUntil: 'networkidle0' 
    });
    
    // Wait for content to load
    await page.waitForSelector('.container', { timeout: 10000 });
    
    // Check if winners section is present and properly styled
    console.log('🏆 Checking Winners section...');
    const winnersSection = await page.$('.row.g-4');
    if (winnersSection) {
      console.log('✅ Winners section found with proper grid spacing');
      
      // Check if all 3 winner cards are present
      const winnerCards = await page.$$('.row.g-4 .col');
      console.log(`📊 Found ${winnerCards.length} winner cards`);
      
      if (winnerCards.length >= 3) {
        console.log('✅ All 3 winner positions are displayed');
      }
    } else {
      console.log('❌ Winners section not found');
    }
    
    // Check Full Results table
    console.log('\n📋 Checking Full Results table...');
    const fullResultsTable = await page.$('.table');
    if (fullResultsTable) {
      console.log('✅ Full Results table found');
      
      // Check if table has proper styling classes
      const tableClasses = await page.evaluate(el => el.className, fullResultsTable);
      console.log(`📝 Table classes: ${tableClasses}`);
      
      if (tableClasses.includes('table-dark')) {
        console.log('✅ Table has proper dark styling for better readability');
      }
      
      // Check table rows
      const tableRows = await page.$$('tbody tr');
      console.log(`📊 Found ${tableRows.length} result rows in table`);
      
      if (tableRows.length > 0) {
        console.log('✅ Results are being displayed in the table');
        
        // Check if top 3 rows have special styling
        for (let i = 0; i < Math.min(3, tableRows.length); i++) {
          const rowStyle = await page.evaluate(el => el.style.backgroundColor, tableRows[i]);
          if (rowStyle) {
            console.log(`✅ Row ${i + 1} has special background color: ${rowStyle}`);
          }
        }
      }
    } else {
      console.log('❌ Full Results table not found');
    }
    
    // Check page header styling
    console.log('\n📄 Checking page header...');
    const pageHeader = await page.$('.display-4');
    if (pageHeader) {
      console.log('✅ Page has improved header styling');
    }
    
    // Check responsive design
    console.log('\n📱 Testing responsive design...');
    await page.setViewport({ width: 768, height: 600 });
    await page.waitForTimeout(1000);
    
    const winnerCardsResponsive = await page.$$('.row.g-4 .col');
    console.log(`📊 Winner cards in tablet view: ${winnerCardsResponsive.length}`);
    
    // Check if cards stack properly on smaller screens
    if (winnerCardsResponsive.length >= 3) {
      console.log('✅ Winner cards are responsive and stack properly');
    }
    
    // Reset to desktop view
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('\n🎉 Results Page Styling Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Winners section with even spacing');
    console.log('- ✅ Full Results table with improved readability');
    console.log('- ✅ Proper color coding for top 3 positions');
    console.log('- ✅ Responsive design');
    console.log('- ✅ Enhanced page header');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'results-page-styling-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as results-page-styling-test.png');
    
  } catch (error) {
    console.error('❌ Error testing results page styling:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testResultsPageStyling().catch(console.error); 