import type { Database } from '../domain/entities'
export function seed(): Database {
  return { version: 1, centres: [
    { id: 'northern', name: 'Northern Scholars Academy', address: '42 Temple Road, Nallur', phone: '0212224100' },
    { id: 'yarl', name: 'Yarl Learning Centre', address: '18 Hospital Road, Jaffna', phone: '0212225200' },
  ], branches: [
    { id: 'nallur', centreId: 'northern', name: 'Nallur', address: '42 Temple Road, Nallur', phone: '0212224100' },
    { id: 'chunnakam', centreId: 'northern', name: 'Chunnakam', address: '15 KKS Road, Chunnakam', phone: '0212241300' },
    { id: 'jaffna', centreId: 'yarl', name: 'Jaffna Town', address: '18 Hospital Road, Jaffna', phone: '0212225200' },
  ], students: ['Nivetha Tharmalingam', 'Arunan Sivakumar', 'Kavitha Rajendran', 'Tharshan Kanagaratnam', 'Abirami Selvarajah', 'Sanjeevan Suthakaran'].map((name, i) => ({ id: `JTH-2026-00${i+1}`, centreId: i > 3 ? 'yarl' : 'northern', branchId: i > 3 ? 'jaffna' : i % 2 ? 'chunnakam' : 'nallur', name, grade: `Grade ${10+i%2}`, guardian: ['Tharmalingam', 'Sivakumar', 'Rajendran', 'Kanagaratnam', 'Selvarajah', 'Suthakaran'][i], phone: `077123450${i}`, createdAt: '2026-10-15T00:00:00Z' })) }
}
