import { NextResponse } from "next/server";
import { companiesService } from "@/services/companiesService";

export async function GET() {
  try {
    const companies = await companiesService.CompaniesList();
    return NextResponse.json(companies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCompany = await companiesService.createCompany(body);
    return NextResponse.json(newCompany);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
