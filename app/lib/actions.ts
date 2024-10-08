'use server'

import { custom, z } from 'zod'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const FormSchema = z.object({
    id : z.string(),
    customerId : z.string(),
    // The amount field is specifically set to coerce (change) from a string to a number while also validating its type.
    amount : z.coerce.number(),
    status : z.enum(['pending', 'paid']),
    date : z.string(),
})

const CreateInvoice = FormSchema.omit({id : true, date : true})

export async function createInvoice (formData: FormData) {
    // if there are a lot of fields, use const rawFormData = Object.fromEntries(formData.entries())
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId : formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
    `
    // clear cache and trigger new request to the server since we update the data displayed in the invoices page
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice (id: string, formData: FormData) {
    const {customerId, amount, status} = CreateInvoice.parse(
        {
            customerId : formData.get('customerId'),
            amount : formData.get('amount'),
            status : formData.get('status')
        }
    )
    const amountInCents = amount * 100;

    await sql `
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    await sql `
        DELETE FROM invoices
        WHERE id = ${id}
    `
    revalidatePath('/dashboard/invoices');
}