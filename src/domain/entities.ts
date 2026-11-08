export type Role = 'Platform admin' | 'Centre admin' | 'Branch staff'
export interface Session { role: Role; centreId: string; branchId: string }
export interface Centre { id: string; name: string; address: string; phone: string }
export interface Branch extends Centre { centreId: string }
export interface Student { id: string; centreId: string; branchId: string; name: string; grade: string; guardian: string; phone: string; createdAt: string }
export interface Database { version: 1; centres: Centre[]; branches: Branch[]; students: Student[] }
export interface Snapshot { centres: Centre[]; branches: Branch[]; students: Student[] }
