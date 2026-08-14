const { createClient } = require('@supabase/supabase-js');

(async () => {
    const fs = require('fs');
    const env = fs.readFileSync('.env', 'utf-8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

    // Login as the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test-automation@shadowsanctuary.local',
        password: 'TestPassword123!'
    });

    if (authError) {
        console.error("Auth failed:", authError);
        return;
    }

    const { data: testItems } = await supabase
        .from('items')
        .select('*')
        .or('name.ilike.%Test%,name.ilike.%AI Extracted%,name.ilike.%Mock%');
        
    console.log("Found Test Items:", testItems ? testItems.length : 0);
    if (testItems && testItems.length > 0) {
        for(const item of testItems) {
            console.log(`- DELETING ITEM: ${item.name} (${item.id})`);
            await supabase.from('items').delete().eq('id', item.id);
            await supabase.from('routine_history').delete().eq('item_id', item.id);
        }
    }
    
    const { data: testJournals } = await supabase
        .from('journal_entries')
        .select('*')
        .ilike('body_text', '%Test%');
        
    console.log("Found Test Journals:", testJournals ? testJournals.length : 0);
    if (testJournals && testJournals.length > 0) {
        for(const j of testJournals) {
            console.log(`- DELETING JOURNAL: ${j.body_text}`);
            await supabase.from('journal_entries').delete().eq('id', j.id);
        }
    }
    
    console.log("Cleanup complete.");
})();
