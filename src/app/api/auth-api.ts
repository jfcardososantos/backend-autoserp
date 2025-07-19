// Exemplo de uso das funções CRUD:
//
// CREATE:
// this.authApi.crud(token, 'usuarios', 'create', undefined, { name: 'João', telefone: '11999999999', funcao: 'admin' }).subscribe(res => console.log(res));
//
// READ:
// this.authApi.crud(token, 'usuarios', 'read', { funcao: 'admin', telefone: '11999999999' }).subscribe(res => console.log(res));
//
// UPDATE:
// this.authApi.crud(token, 'usuarios', 'update', { telefone: '11999999999' }, { funcao: 'supervisor' }).subscribe(res => console.log(res));
//
// DELETE:
// this.authApi.crud(token, 'usuarios', 'delete', { funcao: 'admin' }).subscribe(res => console.log(res));

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000'; // Troque para o endereço do seu backend

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  constructor(private http: HttpClient) {}

  // CRUD genérico (create, read, update, delete)
  crud(
    token: string,
    table: string,
    action: 'create' | 'read' | 'update' | 'delete',
    filters?: any,
    data?: any
  ): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(
      `${API_URL}/crud`,
      { table, action, filters, data },
      { headers }
    );
  }
} 