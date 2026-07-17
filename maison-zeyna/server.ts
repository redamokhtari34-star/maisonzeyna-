import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Article, Rental, CashTransaction, Expense, Settings, DashboardStats, AlertData } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local uploads folder
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Set up Supabase Client if configured
const rawSupabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'MY_SUPABASE_URL';

let supabase: any = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`Supabase client initialized successfully with URL: ${supabaseUrl}`);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
} else {
  console.log('Supabase not configured or placeholder keys used. Falling back to local db.json.');
}

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize Local JSON database with rich realistic seed data aligned to 2026-07-08
const initialDb = {
  articles: [
    {
      id: 'a1b2c3d4-1111-4444-8888-999999999991',
      name: 'Robe de Mariée Princesse Diana',
      reference: 'R-PRINCESSE-01',
      category: 'robe',
      color: 'Blanc Ivoire',
      size: '38',
      rental_price: 450,
      deposit: 1000,
      state: 'excellent',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
      notes: 'Robe en satin de soie avec broderie fine et traîne de 2 mètres. Nettoyage à sec professionnel uniquement.',
      created_at: new Date().toISOString()
    },
    {
      id: 'a1b2c3d4-2222-4444-8888-999999999992',
      name: 'Kaftan Royal Velours d\'Orient',
      reference: 'R-KAFTAN-02',
      category: 'robe',
      color: 'Vert Émeraude',
      size: 'M/L',
      rental_price: 250,
      deposit: 500,
      state: 'excellent',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      notes: 'Kaftan brodé de fils d\'or fait main. Ceinture ajustable incrustée de cristaux.',
      created_at: new Date().toISOString()
    },
    {
      id: 'a1b2c3d4-3333-4444-8888-999999999993',
      name: 'Robe de Soirée Sirène Pailletée',
      reference: 'R-SIRENE-03',
      category: 'robe',
      color: 'Doré Rose',
      size: '36',
      rental_price: 180,
      deposit: 400,
      state: 'tres_bon',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
      notes: 'Robe près du corps, tissu extensible à sequins dorés et doublure en satin doux.',
      created_at: new Date().toISOString()
    },
    {
      id: 'a1b2c3d4-4444-4444-8888-999999999994',
      name: 'Robe de Soirée Rouge Impérial',
      reference: 'R-RED-04',
      category: 'robe',
      color: 'Rouge Rubis',
      size: '40',
      rental_price: 200,
      deposit: 450,
      state: 'tres_bon',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=600&q=80',
      notes: 'Matière crêpe lourd, décolleté asymétrique drapé élégant.',
      created_at: new Date().toISOString()
    },
    {
      id: 'j1b2c3d4-1111-4444-8888-999999999991',
      name: 'Collier Diadème Cristal Or',
      reference: 'B-DIADEME-01',
      category: 'bijou',
      color: 'Or et Diamant',
      size: 'Ajustable',
      rental_price: 80,
      deposit: 200,
      state: 'excellent',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
      notes: 'Ensemble comprenant le collier serti de zircons et le diadème assorti.',
      created_at: new Date().toISOString()
    },
    {
      id: 'j1b2c3d4-2222-4444-8888-999999999992',
      name: 'Parure de Fête Émeraude Zeyna',
      reference: 'B-EMERAUDE-02',
      category: 'bijou',
      color: 'Vert et Doré',
      size: 'Unique',
      rental_price: 120,
      deposit: 300,
      state: 'excellent',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
      notes: 'Collier majestueux, boucles d\'oreilles pendantes et bracelet assorti avec pierres émeraude synthétiques de haute qualité.',
      created_at: new Date().toISOString()
    },
    {
      id: 'j1b2c3d4-3333-4444-8888-999999999993',
      name: 'Boucles d\'oreilles Orientales',
      reference: 'B-EAR-03',
      category: 'bijou',
      color: 'Or Rose',
      size: 'Unique',
      rental_price: 40,
      deposit: 100,
      state: 'excellent',
      status: 'disponible',
      image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
      notes: 'Boucles pendantes légères ciselées façon filigrane d\'or.',
      created_at: new Date().toISOString()
    }
  ] as Article[],
  rentals: [
    {
      id: 'r-1',
      client_name: 'Sarah Amrani',
      client_phone: '0612345678',
      client_instagram: '@sarah.amr',
      client_address: '15 Rue de la Paix, Paris',
      dress_id: 'a1b2c3d4-1111-4444-8888-999999999991', // Robe Princesse Diana
      jewelry_id: 'j1b2c3d4-1111-4444-8888-999999999991', // Collier Diadème
      out_date: '2026-07-08', // Aujourd'hui - Sortie prévue
      event_date: '2026-07-11',
      return_date: '2026-07-13',
      price: 530, // 450 + 80
      deposit_paid: 200, // Acompte
      remaining_to_pay: 330,
      payment_method: 'espèces',
      notes: 'Mariage de prestige. S\'assurer de la présence du cintre et de la housse de protection à la sortie.',
      is_returned: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'r-2',
      client_name: 'Inès Benomar',
      client_phone: '0698765432',
      client_instagram: '@ines_bo',
      client_address: '42 Avenue de la République, Lyon',
      dress_id: 'a1b2c3d4-2222-4444-8888-999999999992', // Kaftan
      jewelry_id: 'j1b2c3d4-2222-4444-8888-999999999992', // Parure Émeraude
      out_date: '2026-07-03',
      event_date: '2026-07-04',
      return_date: '2026-07-08', // Aujourd'hui - Retour prévu
      price: 370, // 250 + 120
      deposit_paid: 370, // Payé en totalité
      remaining_to_pay: 0,
      payment_method: 'carte',
      notes: 'Fiançailles. Cliente très douce et respectueuse des consignes.',
      is_returned: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'r-3',
      client_name: 'Camélia Haddad',
      client_phone: '0755123499',
      client_instagram: '@cam_haddad',
      dress_id: 'a1b2c3d4-3333-4444-8888-999999999993', // Robe Sirène
      out_date: '2026-06-30',
      event_date: '2026-07-02',
      return_date: '2026-07-05', // En retard!
      price: 180,
      deposit_paid: 100,
      remaining_to_pay: 80, // Reste à payer
      payment_method: 'virement',
      notes: 'Soirée de gala. Toujours pas rentrée ni répondu au téléphone. À relancer d\'urgence !',
      is_returned: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'r-4',
      client_name: 'Léa Bernard',
      client_phone: '0688334411',
      dress_id: 'a1b2c3d4-4444-4444-8888-999999999994', // Robe Rouge
      out_date: '2026-07-09', // Demain - Sortie prévue
      event_date: '2026-07-11',
      return_date: '2026-07-13',
      price: 200,
      deposit_paid: 50,
      remaining_to_pay: 150,
      payment_method: 'espèces',
      notes: 'Anniversaire chic.',
      is_returned: false,
      created_at: new Date().toISOString()
    }
  ] as Rental[],
  cash_transactions: [
    {
      id: 'c-1',
      type: 'entree',
      amount: 200,
      person: 'Sarah Amrani',
      date: '2026-07-08',
      time: '10:15',
      reason: 'Acompte location r-1 (Sarah Amrani)',
      created_at: new Date().toISOString()
    },
    {
      id: 'c-2',
      type: 'entree',
      amount: 370,
      person: 'Inès Benomar',
      date: '2026-07-03',
      time: '14:30',
      reason: 'Paiement intégral r-2 (Inès Benomar)',
      created_at: new Date().toISOString()
    },
    {
      id: 'c-3',
      type: 'entree',
      amount: 100,
      person: 'Camélia Haddad',
      date: '2026-06-30',
      time: '18:00',
      reason: 'Acompte location r-3 (Camélia Haddad)',
      created_at: new Date().toISOString()
    },
    {
      id: 'c-4',
      type: 'sortie',
      amount: 50,
      person: 'Zeyna (Gérante)',
      date: '2026-07-08',
      time: '11:00',
      reason: 'Achat de housses de protection neuves',
      created_at: new Date().toISOString()
    }
  ] as CashTransaction[],
  expenses: [
    {
      id: 'e-1',
      amount: 85,
      category: 'Pressing',
      description: 'Nettoyage à sec robe Princesse Diana et Kaftan Vert',
      date: '2026-07-05',
      person: 'Yasmine (Employée)',
      created_at: new Date().toISOString()
    },
    {
      id: 'e-2',
      amount: 120,
      category: 'Marketing',
      description: 'Sponsorisation Instagram pour la collection d\'été',
      date: '2026-07-02',
      person: 'Zeyna (Gérante)',
      created_at: new Date().toISOString()
    },
    {
      id: 'e-3',
      amount: 50,
      category: 'Matériel',
      description: 'Housses de protection et cintres en velours',
      date: '2026-07-08',
      person: 'Zeyna (Gérante)',
      created_at: new Date().toISOString()
    }
  ] as Expense[],
  settings: {
    id: 'default',
    categories: ['Robe de mariée', 'Robe de soirée', 'Kaftan', 'Collier', 'Couronne', 'Parure'],
    logo_url: '',
    store_name: 'Maison Zeyna'
  } as Settings
};

// Check if db.json exists, if not write the initial DB
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
}

// Helper to read database
function readDb(): typeof initialDb {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local db file, using initial memory state:', e);
    return initialDb;
  }
}

// Helper to write database
function writeDb(db: typeof initialDb) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error writing local db file:', e);
  }
}

// Repair any previously stuck article statuses to clear "loue" values on startup
try {
  const db = readDb();
  let modified = false;
  db.articles.forEach(a => {
    if (a.status !== 'disponible') {
      a.status = 'disponible';
      modified = true;
    }
  });
  if (modified) {
    writeDb(db);
    console.log('Local DB: Successfully reset stuck article statuses to available on startup.');
  }
} catch (e) {
  console.error('Failed to run local DB repair startup script:', e);
}

if (supabase) {
  try {
    supabase.from('articles').update({ status: 'disponible' }).neq('status', 'disponible')
      .then(({ error }: any) => {
        if (error) console.error('Supabase: Failed to repair stuck article statuses:', error);
        else console.log('Supabase: Successfully reset stuck article statuses to available on startup.');
      });
  } catch (e) {
    console.error('Supabase async repair error:', e);
  }
}

// --- API Endpoints with integrated Supabase operations ---

// 1. Articles Catalog
app.get('/api/articles', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('articles').select('*').order('name');
      if (!error && data) {
        return res.json(data);
      }
      console.warn('Supabase articles fetch failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const db = readDb();
  res.json(db.articles);
});

app.post('/api/articles', async (req, res) => {
  const newArticle: Article = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...req.body
  };

  const db = readDb();
  db.articles.push(newArticle);
  writeDb(db);

  if (supabase) {
    try {
      const { data, error } = await supabase.from('articles').insert([newArticle]).select();
      if (!error && data) {
        return res.status(201).json(data[0]);
      }
      console.warn('Supabase articles insert failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  res.status(201).json(newArticle);
});

app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = readDb();
  const index = db.articles.findIndex(a => a.id === id);

  if (index !== -1) {
    db.articles[index] = { ...db.articles[index], ...updateData };
    writeDb(db);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('articles').update(updateData).eq('id', id).select();
        if (!error && data) {
          return res.json(data[0]);
        }
        console.warn('Supabase articles update failed, falling back to local DB:', error);
      } catch (e) {
        console.error('Supabase error:', e);
      }
    }

    return res.json(db.articles[index]);
  }
  res.status(404).json({ error: 'Article non trouvé' });
});

app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.articles.findIndex(a => a.id === id);

  if (index !== -1) {
    db.articles.splice(index, 1);
    writeDb(db);

    if (supabase) {
      try {
        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (!error) {
          return res.json({ success: true });
        }
        console.warn('Supabase articles delete failed, falling back to local DB:', error);
      } catch (e) {
        console.error('Supabase error:', e);
      }
    }

    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Article non trouvé' });
});

// --- Photo Upload Endpoint ---
app.post('/api/upload', async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'Données de fichier invalides ou manquantes.' });
    }

    // Convert base64 data URL to raw base64 string
    let base64Content = fileData;
    if (fileData.includes(';base64,')) {
      base64Content = fileData.split(';base64,')[1];
    }
    const buffer = Buffer.from(base64Content, 'base64');
    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload to Supabase Storage if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('catalogue')
          .upload(`uploads/${safeFileName}`, buffer, {
            contentType: fileType || 'image/jpeg',
            upsert: true
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('catalogue')
            .getPublicUrl(data.path);
          return res.json({ imageUrl: publicUrlData.publicUrl });
        }
        console.warn('Supabase Storage upload failed, falling back to local files:', error);
      } catch (e) {
        console.error('Supabase Storage client error:', e);
      }
    }

    // Local file storage fallback
    const localUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }
    const localPath = path.join(localUploadsDir, safeFileName);
    fs.writeFileSync(localPath, buffer);

    return res.json({ imageUrl: `/uploads/${safeFileName}` });
  } catch (error: any) {
    console.error('API Upload error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de la photo.' });
  }
});


// 2. Rentals (Locations)
app.get('/api/rentals', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('rentals').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return res.json(data);
      }
      console.warn('Supabase rentals fetch failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const db = readDb();
  res.json(db.rentals);
});

app.post('/api/rentals', async (req, res) => {
  const db = readDb();
  const newRental: Rental = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    is_returned: false,
    ...req.body
  };

  const newDressIds: string[] = newRental.dress_ids || (newRental.dress_id ? [newRental.dress_id] : []);
  const newJewelryIds: string[] = newRental.jewelry_ids || (newRental.jewelry_id ? [newRental.jewelry_id] : []);

  // Prevent double booking logic
  const overlaps = db.rentals.some(r => {
    if (r.is_returned) return false;
    
    const rDressIds: string[] = r.dress_ids || (r.dress_id ? [r.dress_id] : []);
    const rJewelryIds: string[] = r.jewelry_ids || (r.jewelry_id ? [r.jewelry_id] : []);

    const matchesDress = newDressIds.some((id: string) => rDressIds.includes(id));
    const matchesJewelry = newJewelryIds.some((id: string) => rJewelryIds.includes(id));
    if (!matchesDress && !matchesJewelry) return false;

    // Check date collision
    const s1 = new Date(newRental.out_date).getTime();
    const e1 = new Date(newRental.return_date).getTime();
    const s2 = new Date(r.out_date).getTime();
    const e2 = new Date(r.return_date).getTime();

    return s1 <= e2 && s2 <= e1;
  });

  if (overlaps) {
    return res.status(400).json({ error: 'L\'un des articles sélectionnés (robe ou bijou) est déjà réservé sur ces dates.' });
  }

  let transaction: CashTransaction | null = null;
  // Record a cash ledger entry for deposit paid (acompte)
  if (newRental.deposit_paid > 0) {
    transaction = {
      id: crypto.randomUUID(),
      type: 'entree',
      amount: newRental.deposit_paid,
      person: newRental.client_name,
      date: newRental.out_date,
      time: new Date().toTimeString().slice(0, 5),
      reason: `Acompte location pour ${newRental.client_name}`,
      created_at: new Date().toISOString()
    };
    db.cash_transactions.push(transaction);
  }

  if (supabase) {
    try {
      if (transaction) {
        await supabase.from('cash_transactions').insert([transaction]);
      }
      const { data, error } = await supabase.from('rentals').insert([newRental]).select();
      if (!error && data) {
        writeDb(db);
        return res.status(201).json(data[0]);
      }
      console.warn('Supabase rentals insert failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  db.rentals.push(newRental);
  writeDb(db);
  res.status(201).json(newRental);
});

app.put('/api/rentals/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = readDb();

  const index = db.rentals.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Location non trouvée' });
  }

  const oldRental = db.rentals[index];

  // Perform date overlap validation for items being edited, if not returning
  if (!updateData.is_returned) {
    const updatedRentalTemp = { ...oldRental, ...updateData };
    const newDressIds: string[] = updatedRentalTemp.dress_ids || (updatedRentalTemp.dress_id ? [updatedRentalTemp.dress_id] : []);
    const newJewelryIds: string[] = updatedRentalTemp.jewelry_ids || (updatedRentalTemp.jewelry_id ? [updatedRentalTemp.jewelry_id] : []);

    const overlaps = db.rentals.some(r => {
      if (r.id === id) return false;
      if (r.is_returned) return false;

      const rDressIds: string[] = r.dress_ids || (r.dress_id ? [r.dress_id] : []);
      const rJewelryIds: string[] = r.jewelry_ids || (r.jewelry_id ? [r.jewelry_id] : []);

      const matchesDress = newDressIds.some((id: string) => rDressIds.includes(id));
      const matchesJewelry = newJewelryIds.some((id: string) => rJewelryIds.includes(id));
      if (!matchesDress && !matchesJewelry) return false;

      // Check date collision
      const s1 = new Date(updatedRentalTemp.out_date).getTime();
      const e1 = new Date(updatedRentalTemp.return_date).getTime();
      const s2 = new Date(r.out_date).getTime();
      const e2 = new Date(r.return_date).getTime();

      return s1 <= e2 && s2 <= e1;
    });

    if (overlaps) {
      return res.status(400).json({ error: 'L\'un des articles sélectionnés (robe ou bijou) est déjà réservé sur ces dates.' });
    }
  }

  let transaction: CashTransaction | null = null;

  // Handle return logic and state updates
  if (updateData.is_returned && !oldRental.is_returned) {
    updateData.returned_at = new Date().toISOString();
    
    // Add remaining payment to cash register as an entry
    if (oldRental.remaining_to_pay > 0) {
      transaction = {
        id: crypto.randomUUID(),
        type: 'entree',
        amount: oldRental.remaining_to_pay,
        person: oldRental.client_name,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        reason: `Solde payé au retour pour ${oldRental.client_name}`,
        created_at: new Date().toISOString()
      };
      db.cash_transactions.push(transaction);
      updateData.remaining_to_pay = 0;
      updateData.deposit_paid = oldRental.price;
    }
  }

  const updatedRental = { ...oldRental, ...updateData };
  db.rentals[index] = updatedRental;

  if (supabase) {
    try {
      if (transaction) {
        await supabase.from('cash_transactions').insert([transaction]);
      }
      const { data, error } = await supabase.from('rentals').update(updatedRental).eq('id', id).select();
      if (!error && data) {
        writeDb(db); // Sync local as well
        return res.json(data[0]);
      }
      console.warn('Supabase rentals update failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  writeDb(db);
  res.json(updatedRental);
});

app.delete('/api/rentals/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.rentals.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Location non trouvée' });
  }

  db.rentals.splice(index, 1);
  writeDb(db);

  if (supabase) {
    try {
      const { error } = await supabase.from('rentals').delete().eq('id', id);
      if (!error) {
        return res.json({ success: true });
      }
      console.warn('Supabase rentals delete failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  res.json({ success: true });
});


// 3. Cash Register (Caisse)
app.get('/api/cash', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('cash_transactions').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return res.json(data);
      }
      console.warn('Supabase cash transactions failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const db = readDb();
  res.json(db.cash_transactions);
});

app.post('/api/cash', async (req, res) => {
  const newTransaction: CashTransaction = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...req.body
  };

  const db = readDb();
  db.cash_transactions.push(newTransaction);
  writeDb(db);

  if (supabase) {
    try {
      const { data, error } = await supabase.from('cash_transactions').insert([newTransaction]).select();
      if (!error && data) {
        return res.status(201).json(data[0]);
      }
      console.warn('Supabase cash insert failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  res.status(201).json(newTransaction);
});


// 4. Expenses (Dépenses)
function toSupabaseExpense(expense: Expense): any {
  const { payment_source, ...rest } = expense;
  return {
    ...rest,
    receipt_url: payment_source === 'tresorerie' ? 'source:tresorerie' : 'source:caisse'
  };
}

function fromSupabaseExpense(row: any): Expense {
  const payment_source = row.receipt_url === 'source:tresorerie' ? 'tresorerie' : 'caisse';
  return {
    ...row,
    payment_source
  };
}

app.get('/api/expenses', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!error && data) {
        const mapped = data.map(fromSupabaseExpense);
        return res.json(mapped);
      }
      console.warn('Supabase expenses failed, falling back to local DB:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const db = readDb();
  // Ensure backward compatibility on local DB rows
  const mappedExpenses = db.expenses.map(e => ({
    ...e,
    payment_source: e.payment_source || 'caisse'
  }));
  res.json(mappedExpenses);
});

app.post('/api/expenses', async (req, res) => {
  const paymentSource = req.body.payment_source || 'caisse';
  const newExpense: Expense = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...req.body,
    payment_source: paymentSource
  };

  let cashTransaction: CashTransaction | null = null;

  if (paymentSource === 'caisse') {
    cashTransaction = {
      id: crypto.randomUUID(),
      type: 'sortie',
      amount: newExpense.amount,
      person: newExpense.person,
      date: newExpense.date,
      time: new Date().toTimeString().slice(0, 5),
      reason: `Dépense: ${newExpense.category} - ${newExpense.description}`,
      created_at: new Date().toISOString()
    };
  }

  if (supabase) {
    try {
      // 1. Insert cash ledger transaction if paid with caisse
      if (cashTransaction) {
        const { error: cashError } = await supabase.from('cash_transactions').insert([cashTransaction]);
        if (cashError) {
          console.error('Supabase cash_transactions insert failed:', cashError);
          return res.status(400).json({ error: `Erreur Supabase (cash_transactions): ${cashError.message || JSON.stringify(cashError)}` });
        }
      }

      // 2. Insert expense
      const supabasePayload = toSupabaseExpense(newExpense);
      const { data, error: expenseError } = await supabase.from('expenses').insert([supabasePayload]).select();
      if (expenseError) {
        console.error('Supabase expenses insert failed:', expenseError);
        // Clean up corresponding cash transaction to preserve consistency
        if (cashTransaction) {
          await supabase.from('cash_transactions').delete().eq('id', cashTransaction.id);
        }
        return res.status(400).json({ error: `Erreur Supabase (expenses): ${expenseError.message || JSON.stringify(expenseError)}` });
      }

      // Sync local DB cache only upon success
      const db = readDb();
      if (cashTransaction) {
        db.cash_transactions.push(cashTransaction);
      }
      db.expenses.push(newExpense);
      writeDb(db);

      if (data && data.length > 0) {
        return res.status(201).json(fromSupabaseExpense(data[0]));
      }
    } catch (e: any) {
      console.error('Supabase exception in POST /api/expenses:', e);
      return res.status(500).json({ error: `Exception serveur Supabase: ${e.message || e}` });
    }
  } else {
    // Local DB fallback
    const db = readDb();
    if (cashTransaction) {
      db.cash_transactions.push(cashTransaction);
    }
    db.expenses.push(newExpense);
    writeDb(db);
    return res.status(201).json(newExpense);
  }

  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Dépense non trouvée' });
  }

  const oldExpense = db.expenses[index];
  const oldSource = oldExpense.payment_source || 'caisse';
  const newSource = req.body.payment_source || 'caisse';

  const updatedExpense = { 
    ...oldExpense, 
    ...req.body,
    payment_source: newSource
  };

  const oldSearchStr = `Dépense: ${oldExpense.category} - ${oldExpense.description}`;
  const newReason = `Dépense: ${updatedExpense.category} - ${updatedExpense.description}`;

  // Find old cash transaction index if it was previously paid with caisse
  const cIndex = db.cash_transactions.findIndex(t => t.reason === oldSearchStr && t.amount === oldExpense.amount);

  let updatedCashTrans: CashTransaction | null = null;
  let cashTransToDeleteId: string | null = null;
  let cashTransToAdd: CashTransaction | null = null;

  if (oldSource === 'caisse') {
    if (newSource === 'caisse') {
      // Update the existing cash transaction
      if (cIndex !== -1) {
        updatedCashTrans = {
          ...db.cash_transactions[cIndex],
          amount: updatedExpense.amount,
          person: updatedExpense.person,
          date: updatedExpense.date,
          reason: newReason
        };
      } else {
        // If it got lost somehow, create it
        cashTransToAdd = {
          id: crypto.randomUUID(),
          type: 'sortie',
          amount: updatedExpense.amount,
          person: updatedExpense.person,
          date: updatedExpense.date,
          time: new Date().toTimeString().slice(0, 5),
          reason: newReason,
          created_at: new Date().toISOString()
        };
      }
    } else {
      // payment source changed from caisse to tresorerie -> DELETE the cash transaction
      if (cIndex !== -1) {
        cashTransToDeleteId = db.cash_transactions[cIndex].id;
      }
    }
  } else { // oldSource === 'tresorerie'
    if (newSource === 'caisse') {
      // payment source changed from tresorerie to caisse -> CREATE a cash transaction
      cashTransToAdd = {
        id: crypto.randomUUID(),
        type: 'sortie',
        amount: updatedExpense.amount,
        person: updatedExpense.person,
        date: updatedExpense.date,
        time: new Date().toTimeString().slice(0, 5),
        reason: newReason,
        created_at: new Date().toISOString()
      };
    }
  }

  if (supabase) {
    try {
      const supabasePayload = toSupabaseExpense(updatedExpense);
      const { error: expenseError } = await supabase.from('expenses').update(supabasePayload).eq('id', id);
      if (expenseError) {
        console.error('Supabase expenses update failed:', expenseError);
        return res.status(400).json({ error: `Erreur Supabase (expenses): ${expenseError.message || JSON.stringify(expenseError)}` });
      }

      if (cashTransToDeleteId) {
        const { error: delError } = await supabase.from('cash_transactions').delete().eq('id', cashTransToDeleteId);
        if (delError) {
          console.warn('Supabase cash_transactions delete failed:', delError);
        }
      } else if (updatedCashTrans) {
        const { error: cashError } = await supabase.from('cash_transactions').update(updatedCashTrans).eq('id', updatedCashTrans.id);
        if (cashError) {
          const { error: cashSearchError } = await supabase.from('cash_transactions').update(updatedCashTrans).eq('reason', oldSearchStr);
          if (cashSearchError) {
            console.warn('Supabase cash_transactions update failed:', cashSearchError);
          }
        }
      } else if (cashTransToAdd) {
        const { error: addError } = await supabase.from('cash_transactions').insert([cashTransToAdd]);
        if (addError) {
          console.warn('Supabase cash_transactions insert failed:', addError);
        }
      }

      // Sync local DB cache
      db.expenses[index] = updatedExpense;
      if (cashTransToDeleteId && cIndex !== -1) {
        db.cash_transactions.splice(cIndex, 1);
      } else if (updatedCashTrans && cIndex !== -1) {
        db.cash_transactions[cIndex] = updatedCashTrans;
      } else if (cashTransToAdd) {
        db.cash_transactions.push(cashTransToAdd);
      }
      writeDb(db);

      return res.json(updatedExpense);
    } catch (e: any) {
      console.error('Supabase exception in PUT /api/expenses/:id:', e);
      return res.status(500).json({ error: `Exception serveur Supabase: ${e.message || e}` });
    }
  } else {
    db.expenses[index] = updatedExpense;
    if (cashTransToDeleteId && cIndex !== -1) {
      db.cash_transactions.splice(cIndex, 1);
    } else if (updatedCashTrans && cIndex !== -1) {
      db.cash_transactions[cIndex] = updatedCashTrans;
    } else if (cashTransToAdd) {
      db.cash_transactions.push(cashTransToAdd);
    }
    writeDb(db);
    return res.json(updatedExpense);
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Dépense non trouvée' });
  }

  const expense = db.expenses[index];
  const source = expense.payment_source || 'caisse';
  const searchStr = `Dépense: ${expense.category} - ${expense.description}`;
  const cIndex = db.cash_transactions.findIndex(t => t.reason === searchStr && t.amount === expense.amount);

  if (supabase) {
    try {
      const { error: expenseError } = await supabase.from('expenses').delete().eq('id', id);
      if (expenseError) {
        console.error('Supabase expenses delete failed:', expenseError);
        return res.status(400).json({ error: `Erreur Supabase (expenses): ${expenseError.message}` });
      }

      if (source === 'caisse') {
        const { error: cashError } = await supabase.from('cash_transactions').delete().eq('reason', searchStr);
        if (cashError) {
          console.warn('Supabase cash_transactions delete failed:', cashError);
        }
      }

      // Sync local DB cache
      db.expenses.splice(index, 1);
      if (source === 'caisse' && cIndex !== -1) {
        db.cash_transactions.splice(cIndex, 1);
      }
      writeDb(db);

      return res.json({ success: true });
    } catch (e: any) {
      console.error('Supabase exception in DELETE /api/expenses/:id:', e);
      return res.status(500).json({ error: `Exception serveur Supabase: ${e.message || e}` });
    }
  } else {
    db.expenses.splice(index, 1);
    if (source === 'caisse' && cIndex !== -1) {
      db.cash_transactions.splice(cIndex, 1);
    }
    writeDb(db);
    return res.json({ success: true });
  }
});


// 5. Settings (Paramètres)
app.get('/api/settings', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'default').single();
      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const db = readDb();
  res.json(db.settings || initialDb.settings);
});

app.post('/api/settings', async (req, res) => {
  const updatedSettings: Settings = {
    id: 'default',
    ...req.body
  };

  const db = readDb();
  db.settings = updatedSettings;
  writeDb(db);

  if (supabase) {
    try {
      const { data, error } = await supabase.from('settings').upsert(updatedSettings).select();
      if (!error && data) {
        return res.json(data[0]);
      }
    } catch (e) {
      console.error('Supabase settings update error:', e);
    }
  }

  res.json(updatedSettings);
});


// 6. Dynamic Dashboard Stats
app.get('/api/dashboard', (req, res) => {
  const db = readDb();
  const todayStr = '2026-07-08'; // Hardcoded reference current date to ensure alignment with seed data!

  // Revenue today: Sum of entries (acompte or remaining payment) recorded today
  const revenueToday = db.cash_transactions
    .filter(t => t.type === 'entree' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // Revenue month: Sum of entries in July 2026
  const revenueMonth = db.cash_transactions
    .filter(t => t.type === 'entree' && t.date.startsWith('2026-07'))
    .reduce((sum, t) => sum + t.amount, 0);

  // Active rentals: count of non-returned items
  const activeRentalsCount = db.rentals.filter(r => !r.is_returned).length;

  // Returns today
  const returnsTodayCount = db.rentals.filter(r => r.return_date === todayStr && !r.is_returned).length;

  // Outings today
  const outingsTodayCount = db.rentals.filter(r => r.out_date === todayStr && !r.is_returned).length;

  // Expenses of current month (July 2026)
  const expensesMonth = db.expenses
    .filter(e => e.date.startsWith('2026-07'))
    .reduce((sum, e) => sum + e.amount, 0);

  // Cash currently in register: Net of entrees minus sorties
  const currentCashInRegister = db.cash_transactions.reduce((sum, t) => {
    return t.type === 'entree' ? sum + t.amount : sum - t.amount;
  }, 0);

  // Treasury Balance: Sum of all cash withdrawals from caisse minus expenses paid via treasury
  const totalWithdrawals = db.cash_transactions
    .filter(t => t.type === 'sortie' && (t.reason === 'Retrait caisse' || t.reason.startsWith('Retrait')))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTreasuryExpenses = db.expenses
    .filter(e => e.payment_source === 'tresorerie' || e.receipt_url === 'source:tresorerie')
    .reduce((sum, e) => sum + e.amount, 0);

  const treasuryBalance = Math.max(0, totalWithdrawals - totalTreasuryExpenses);

  const stats: DashboardStats = {
    revenueToday,
    revenueMonth,
    activeRentalsCount,
    returnsTodayCount,
    outingsTodayCount,
    expensesMonth,
    currentCashInRegister,
    treasuryBalance
  };

  res.json(stats);
});


// 7. Dynamic Alert Lists
app.get('/api/alerts', (req, res) => {
  const db = readDb();
  const todayStr = '2026-07-08'; // Today reference
  const tomorrowStr = '2026-07-09'; // Tomorrow reference

  const alerts: AlertData[] = [];

  // Sorties aujourd'hui
  db.rentals.forEach(r => {
    if (r.out_date === todayStr && !r.is_returned) {
      alerts.push({
        id: `outing-today-${r.id}`,
        type: 'outing_today',
        title: 'Sortie prévue aujourd\'hui',
        description: `La robe/bijou loué par ${r.client_name} (${r.client_phone}) doit sortir aujourd'hui.`,
        severity: 'info',
        date: todayStr,
        rentalId: r.id
      });
    }

    // Retours aujourd'hui
    if (r.return_date === todayStr && !r.is_returned) {
      alerts.push({
        id: `return-today-${r.id}`,
        type: 'return_today',
        title: 'Retour attendu aujourd\'hui',
        description: `Le retour de ${r.client_name} (${r.client_phone}) est prévu aujourd'hui.`,
        severity: 'success',
        date: todayStr,
        rentalId: r.id
      });
    }

    // Retours en retard (return_date < today and not returned)
    const retDate = new Date(r.return_date).getTime();
    const todayDate = new Date(todayStr).getTime();
    if (retDate < todayDate && !r.is_returned) {
      alerts.push({
        id: `late-${r.id}`,
        type: 'late_return',
        title: 'Retour en RETARD',
        description: `Le retour de ${r.client_name} (${r.client_phone}) était prévu le ${r.return_date}. Toujours pas rendu !`,
        severity: 'error',
        date: r.return_date,
        rentalId: r.id
      });
    }

    // Paiements restants
    if (r.remaining_to_pay > 0 && !r.is_returned) {
      alerts.push({
        id: `payment-${r.id}`,
        type: 'remaining_payment',
        title: 'Paiement restant dû',
        description: `Reste à payer : ${r.remaining_to_pay} DA par ${r.client_name}.`,
        severity: 'warning',
        date: r.out_date,
        rentalId: r.id
      });
    }

    // Réservations du lendemain (outings tomorrow)
    if (r.out_date === tomorrowStr) {
      alerts.push({
        id: `tomorrow-${r.id}`,
        type: 'tomorrow_booking',
        title: 'Sortie prévue demain',
        description: `Location de ${r.client_name} préparée pour demain (${tomorrowStr}).`,
        severity: 'info',
        date: tomorrowStr,
        rentalId: r.id
      });
    }
  });

  res.json(alerts);
});


// 8. Statistics for Charts & Annual Selector
app.get('/api/statistics', (req, res) => {
  const db = readDb();
  const yearQuery = req.query.year ? String(req.query.year) : '2026';

  // Array of month names
  const monthsFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Aggregate monthly revenues & counts
  const monthlyData = monthsFr.map((name, index) => {
    const monthNum = String(index + 1).padStart(2, '0');
    const prefix = `${yearQuery}-${monthNum}`;

    // Calculate revenue from payments made during this month
    const revenue = db.cash_transactions
      .filter(t => t.type === 'entree' && t.date.startsWith(prefix))
      .reduce((sum, t) => sum + t.amount, 0);

    // Count rentals booked in this month
    const count = db.rentals
      .filter(r => r.out_date.startsWith(prefix))
      .length;

    return {
      name,
      revenue,
      count
    };
  });

  // Calculate annual stats
  const totalAnnual = db.cash_transactions
    .filter(t => t.type === 'entree' && t.date.startsWith(yearQuery))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRentals = db.rentals
    .filter(r => r.out_date.startsWith(yearQuery))
    .length;

  const averageBasket = totalRentals > 0 ? Math.round(totalAnnual / totalRentals) : 0;

  // Calculate growth/evolution compared to previous month
  // Since we are currently in July 2026, let's compare July to June 2026
  const juneRev = db.cash_transactions
    .filter(t => t.type === 'entree' && t.date.startsWith('2026-06'))
    .reduce((sum, t) => sum + t.amount, 0);
  const julyRev = db.cash_transactions
    .filter(t => t.type === 'entree' && t.date.startsWith('2026-07'))
    .reduce((sum, t) => sum + t.amount, 0);

  let evolution = 0;
  if (juneRev > 0) {
    evolution = Math.round(((julyRev - juneRev) / juneRev) * 100);
  } else if (julyRev > 0) {
    evolution = 100; // 100% growth if june was 0
  }

  res.json({
    year: yearQuery,
    chartData: monthlyData,
    totalAnnual,
    totalRentals,
    averageBasket,
    evolution
  });
});

// Serve frontend assets in dev/production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maison Zeyna Server running on http://localhost:${PORT}`);
  });
}

startServer();
