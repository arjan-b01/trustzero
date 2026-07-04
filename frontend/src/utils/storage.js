// Storage utility to manage local escrows and seed mock data since the backend doesn't support listing escrows

const MOCK_ESCROWS = [
  {
    id: 101,
    title: "Freelance Website Development",
    description: "Full-stack React & Spring Boot corporate site development with secure admin dashboard.",
    amount: 1500.00,
    platformFee: 45.00,
    lockedAmount: 1455.00,
    commissionRate: 0.03,
    status: "RELEASED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 2,
    sellerName: "Alice Dev",
    disputeReason: null,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 102,
    title: "Premium Logo Design UI/UX",
    description: "Custom branding assets, design system components, and vectorized files delivery.",
    amount: 350.00,
    platformFee: 10.50,
    lockedAmount: 339.50,
    commissionRate: 0.03,
    status: "FUNDED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 3,
    sellerName: "Bob Designer",
    disputeReason: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 103,
    title: "Database Performance Audit",
    description: "Optimize PostgreSQL queries, pessimistic locking execution, and index rebuilding.",
    amount: 800.00,
    platformFee: 24.00,
    lockedAmount: 776.00,
    commissionRate: 0.03,
    status: "DISPUTED",
    buyerId: 1,
    buyerName: "Umang Jain",
    sellerId: 4,
    sellerName: "Charlie DBA",
    disputeReason: "Structured dispute opened by BUYER: Deliverables did not match performance requirements.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getLocalEscrows = () => {
  const key = 'tz_global_escrows';
  const data = localStorage.getItem(key);
  let allEscrows = [];
  if (!data) {
    localStorage.setItem(key, JSON.stringify(MOCK_ESCROWS));
    allEscrows = MOCK_ESCROWS;
  } else {
    allEscrows = JSON.parse(data);
  }

  const userStr = localStorage.getItem('tz_user');
  if (!userStr) return [];
  const user = JSON.parse(userStr);

  if (user.role === 'ADMIN') {
    return allEscrows;
  }

  return allEscrows.filter(
    (escrow) =>
      escrow.buyerName === user.name ||
      escrow.sellerName === user.name ||
      escrow.buyerId === user.userId ||
      escrow.sellerId === user.userId
  );
};

export const saveLocalEscrow = (userEmail, escrow) => {
  if (!escrow) return;
  const key = 'tz_global_escrows';
  
  const data = localStorage.getItem(key);
  const allEscrows = data ? JSON.parse(data) : [...MOCK_ESCROWS];
  
  if (!allEscrows.some(e => e.id === escrow.id)) {
    allEscrows.unshift(escrow);
    localStorage.setItem(key, JSON.stringify(allEscrows));
  }
};

export const updateLocalEscrowStatus = (userEmail, escrowId, newStatus, additionalFields = {}) => {
  if (!escrowId) return;
  const key = 'tz_global_escrows';
  
  const data = localStorage.getItem(key);
  const allEscrows = data ? JSON.parse(data) : [...MOCK_ESCROWS];
  
  const index = allEscrows.findIndex(e => e.id === Number(escrowId));
  if (index !== -1) {
    allEscrows[index] = {
      ...allEscrows[index],
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...additionalFields
    };
    localStorage.setItem(key, JSON.stringify(allEscrows));
  }
};
