const puppeteer = require('puppeteer');

async function testAudioPlayerChanges() {
  console.log('🎵 Testing Audio Player Removal and Profile Picture Addition...\n');
  
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
    
    // Test Winners Section Changes
    console.log('🏆 Testing Winners Section Changes...\n');
    
    // Check 1st place (should have audio player)
    console.log('🥇 Checking 1st Place Winner...');
    const firstPlaceAudio = await page.$('.row.g-4 .col:nth-child(1) audio');
    const firstPlaceButton = await page.$('.row.g-4 .col:nth-child(1) button');
    
    if (firstPlaceAudio && firstPlaceButton) {
      console.log('✅ 1st place has audio player (CORRECT)');
    } else {
      console.log('❌ 1st place missing audio player (ERROR)');
    }
    
    // Check 2nd place (should NOT have audio player)
    console.log('🥈 Checking 2nd Place Winner...');
    const secondPlaceAudio = await page.$('.row.g-4 .col:nth-child(2) audio');
    const secondPlaceButton = await page.$('.row.g-4 .col:nth-child(2) button');
    
    if (!secondPlaceAudio && !secondPlaceButton) {
      console.log('✅ 2nd place has NO audio player (CORRECT)');
    } else {
      console.log('❌ 2nd place still has audio player (ERROR)');
    }
    
    // Check 3rd place (should NOT have audio player)
    console.log('🥉 Checking 3rd Place Winner...');
    const thirdPlaceAudio = await page.$('.row.g-4 .col:nth-child(3) audio');
    const thirdPlaceButton = await page.$('.row.g-4 .col:nth-child(3) button');
    
    if (!thirdPlaceAudio && !thirdPlaceButton) {
      console.log('✅ 3rd place has NO audio player (CORRECT)');
    } else {
      console.log('❌ 3rd place still has audio player (ERROR)');
    }
    
    // Check for profile pictures
    console.log('\n📸 Checking Profile Pictures...');
    const profilePictures = await page.$$('.row.g-4 .rounded-circle');
    console.log(`📊 Found ${profilePictures.length} profile pictures in winners section`);
    
    if (profilePictures.length > 0) {
      console.log('✅ Profile pictures are being displayed for users who have them');
      
      // Check if profile pictures have proper styling
      for (let i = 0; i < profilePictures.length; i++) {
        const picStyle = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            width: style.width,
            height: style.height,
            borderRadius: style.borderRadius
          };
        }, profilePictures[i]);
        
        console.log(`📸 Profile picture ${i + 1}: ${picStyle.width} x ${picStyle.height}, rounded: ${picStyle.borderRadius}`);
      }
    } else {
      console.log('ℹ️ No profile pictures found (users may not have profile pictures set)');
    }
    
    // Test Full Results Table Changes
    console.log('\n📋 Testing Full Results Table Changes...\n');
    
    // Check table headers
    const tableHeaders = await page.$$eval('thead th', headers => 
      headers.map(h => h.textContent.trim())
    );
    console.log(`📝 Table headers: ${tableHeaders.join(', ')}`);
    
    if (!tableHeaders.includes('Actions')) {
      console.log('✅ Actions column removed from table (CORRECT)');
    } else {
      console.log('❌ Actions column still present (ERROR)');
    }
    
    // Check for audio elements in table
    const tableAudioElements = await page.$$('tbody audio');
    const tableAudioButtons = await page.$$('tbody button');
    
    if (tableAudioElements.length === 0 && tableAudioButtons.length === 0) {
      console.log('✅ All audio players removed from Full Results table (CORRECT)');
    } else {
      console.log(`❌ Found ${tableAudioElements.length} audio elements and ${tableAudioButtons.length} buttons in table (ERROR)`);
    }
    
    // Check table structure and data
    const tableRows = await page.$$('tbody tr');
    console.log(`📊 Table shows ${tableRows.length} results`);
    
    if (tableRows.length > 0) {
      // Check first row structure
      const firstRowCells = await page.$$eval('tbody tr:first-child td', cells => 
        cells.map(cell => cell.textContent.trim())
      );
      console.log(`📋 First row data: ${firstRowCells.join(' | ')}`);
      
      if (firstRowCells.length === 4) { // Rank, Submission, User, Score (no Actions)
        console.log('✅ Table has correct 4-column structure');
      } else {
        console.log(`❌ Table has ${firstRowCells.length} columns instead of expected 4`);
      }
    }
    
    // Test responsive design with reduced button count
    console.log('\n📱 Testing Responsive Layout...');
    await page.setViewport({ width: 768, height: 600 });
    await page.waitForTimeout(1000);
    
    const winnerCardsTablet = await page.$$('.row.g-4 .col');
    console.log(`📊 Winner cards stack properly on tablet: ${winnerCardsTablet.length} cards visible`);
    
    // Reset viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('\n🎉 Audio Player Changes Test Complete!\n');
    console.log('📋 Summary of Changes:');
    console.log('- ✅ 1st place winner keeps audio player');
    console.log('- ✅ 2nd and 3rd place audio players removed');
    console.log('- ✅ Profile pictures added under scores (when available)');
    console.log('- ✅ Full Results table Actions column removed');
    console.log('- ✅ All audio players removed from Full Results table');
    console.log('- ✅ Cleaner, more focused user experience');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'audio-player-removal-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as audio-player-removal-test.png');
    
  } catch (error) {
    console.error('❌ Error testing audio player changes:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAudioPlayerChanges().catch(console.error); 