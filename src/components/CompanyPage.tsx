import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Building2,
  Clock,
  Share2,
  MapPin,
  Users,
  FileText,
  Phone,
  Mail,
  Map,
  Edit3
} from 'lucide-react';
import { apiService } from '../services/api';

interface Company {
  id: number;
  full_name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  status: 'pending' | 'verified' | 'suspended';
  latitude?: number;
  longitude?: number;
  logo_url?: string;
}

interface CompanyHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface CompanySocial {
  id: number;
  company_id: number;
  platform: string;
  url: string;
  created_at: string;
}

interface CompanyGallery {
  id: number;
  company_id: number;
  path: string;
  created_at: string;
}

interface CompanyDocument {
  id: number;
  company_id: number;
  doc_type: string;
  path: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

interface DeliveryZone {
  id: number;
  company_id: number;
  name: string;
  zone_type: 'radius' | 'polygon';
  center_lat?: number;
  center_lng?: number;
  radius_m?: number;
  polygon?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyBranch {
  id: number;
  company_id: number;
  branch_name: string;
  branch_address?: string;
  branch_image?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContact {
  id: number;
  company_id: number;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

interface CompanyPageProps {
  onBack?: () => void;
}

const CompanyPage: React.FC<CompanyPageProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Company profile state
  const [companyForm, setCompanyForm] = useState<{
    full_name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    status: 'pending' | 'verified' | 'suspended';
  }>({
    full_name: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    status: 'pending'
  });
  
  // Company hours state
  const [companyHours, setCompanyHours] = useState<CompanyHours[]>([]);
  
  // Social media state
  const [companySocials, setCompanySocials] = useState<CompanySocial[]>([]);
  
  // Gallery state
  const [companyGallery, setCompanyGallery] = useState<CompanyGallery[]>([]);
  
  // Documents state
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>([]);
  
  // Delivery zones state
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  
  // Branches state
  const [companyBranches, setCompanyBranches] = useState<CompanyBranch[]>([]);
  
  // Contacts state
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states for different sections
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  
  // Form data states
  const [socialForm, setSocialForm] = useState({ platform: '', url: '' });
  const [galleryForm, setGalleryForm] = useState({ file: null as File | null });
  const [documentForm, setDocumentForm] = useState({ doc_type: '', file: null as File | null });
  const [zoneForm, setZoneForm] = useState({ name: '', zone_type: 'radius' as 'radius' | 'polygon', center_lat: '', center_lng: '', radius_m: '' });
  const [branchForm, setBranchForm] = useState({ branch_name: '', branch_address: '', branch_image: null as File | null });
  const [contactForm, setContactForm] = useState({ phone: '', email: '', address: '' });

  // Lazy loading state for each tab
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['profile']));
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Form submission handlers
  const handleCompanyUpdate = async () => {
    if (!selectedCompany) return;
    
    try {
      await apiService.upsertCompany({
        id: selectedCompany.id,
        ...companyForm
      });
      
      // Refresh company data
      const company = await apiService.getUserCompany();
      setCompanies([company]);
      setSelectedCompany(company);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
    }
  };

  const handleUpdateHours = async () => {
    if (!selectedCompany) return;
    
    try {
      await apiService.setCompanyHours(selectedCompany.id, companyHours);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update business hours');
    }
  };

  const handleAddSocial = async () => {
    if (!selectedCompany || !socialForm.platform || !socialForm.url) return;
    
    try {
      await apiService.addCompanySocial(selectedCompany.id, socialForm.platform, socialForm.url);
      setSocialForm({ platform: '', url: '' });
      setShowAddSocial(false);
      
      // Refresh social media list
      const socialsResponse = await apiService.listCompanySocials(selectedCompany.id);
      setCompanySocials(socialsResponse.socials);
    } catch (err: any) {
      setError(err.message || 'Failed to add social media');
    }
  };

  const handleAddGallery = async () => {
    if (!selectedCompany || !galleryForm.file) return;
    
    try {
      setUploading(true);
      const fileBase64 = await fileToBase64(galleryForm.file);
      await apiService.addCompanyGallery(selectedCompany.id, fileBase64);
      setGalleryForm({ file: null });
      setShowAddGallery(false);
      
      // Refresh gallery list
      const galleryResponse = await apiService.listCompanyGallery(selectedCompany.id);
      setCompanyGallery(galleryResponse.gallery);
    } catch (err: any) {
      setError(err.message || 'Failed to add gallery image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedCompany || !documentForm.doc_type || !documentForm.file) return;
    
    try {
      setUploading(true);
      const fileBase64 = await fileToBase64(documentForm.file);
      await apiService.addCompanyDocument(selectedCompany.id, documentForm.doc_type, fileBase64);
      setDocumentForm({ doc_type: '', file: null });
      setShowAddDocument(false);
      
      // Refresh documents list
      const documentsResponse = await apiService.listCompanyDocuments(selectedCompany.id);
      setCompanyDocuments(documentsResponse.documents);
    } catch (err: any) {
      setError(err.message || 'Failed to add document');
    } finally {
      setUploading(false);
    }
  };

  const handleAddZone = async () => {
    if (!selectedCompany || !zoneForm.name) return;
    
    try {
      await apiService.upsertDeliveryZone({
        company_id: selectedCompany.id,
        name: zoneForm.name,
        zone_type: zoneForm.zone_type,
        center_lat: zoneForm.center_lat ? parseFloat(zoneForm.center_lat) : undefined,
        center_lng: zoneForm.center_lng ? parseFloat(zoneForm.center_lng) : undefined,
        radius_m: zoneForm.radius_m ? parseInt(zoneForm.radius_m) : undefined
      });
      setZoneForm({ name: '', zone_type: 'radius', center_lat: '', center_lng: '', radius_m: '' });
      setShowAddZone(false);
      
      // Refresh zones list
      const zonesResponse = await apiService.listDeliveryZones(selectedCompany.id);
      setDeliveryZones(zonesResponse.zones);
    } catch (err: any) {
      setError(err.message || 'Failed to add delivery zone');
    }
  };

  const handleAddBranch = async () => {
    if (!selectedCompany || !branchForm.branch_name) return;
    
    try {
      let branchImageBase64 = undefined;
      if (branchForm.branch_image) {
        branchImageBase64 = await fileToBase64(branchForm.branch_image);
      }
      
      await apiService.upsertBranch({
        company_id: selectedCompany.id,
        branch_name: branchForm.branch_name,
        branch_address: branchForm.branch_address,
        branch_image: branchImageBase64
      });
      setBranchForm({ branch_name: '', branch_address: '', branch_image: null });
      setShowAddBranch(false);
      
      // Refresh branches list
      const branchesResponse = await apiService.listBranches(selectedCompany.id);
      setCompanyBranches(branchesResponse.branches);
    } catch (err: any) {
      setError(err.message || 'Failed to add branch');
    }
  };

  const handleAddContact = async () => {
    if (!selectedCompany || (!contactForm.phone && !contactForm.email && !contactForm.address)) return;
    
    try {
      await apiService.addContact({
        company_id: selectedCompany.id,
        phone: contactForm.phone || undefined,
        email: contactForm.email || undefined,
        address: contactForm.address || undefined
      });
      setContactForm({ phone: '', email: '', address: '' });
      setShowAddContact(false);
      
      // Refresh contacts list
      const contactsResponse = await apiService.listContacts(selectedCompany.id);
      setCompanyContacts(contactsResponse.contacts);
    } catch (err: any) {
      setError(err.message || 'Failed to add contact');
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Delete handlers
  const handleDeleteSocial = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteCompanySocial(selectedCompany.id, id);
      setCompanySocials(prev => prev.filter(social => social.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete social media');
    }
  };

  const handleDeleteGallery = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteCompanyGallery(selectedCompany.id, id);
      setCompanyGallery(prev => prev.filter(image => image.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete gallery image');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteCompanyDocument(selectedCompany.id, id);
      setCompanyDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteDeliveryZone(selectedCompany.id, id);
      setDeliveryZones(prev => prev.filter(zone => zone.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete delivery zone');
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteBranch(selectedCompany.id, id);
      setCompanyBranches(prev => prev.filter(branch => branch.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete branch');
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!selectedCompany) return;
    
    try {
      await apiService.deleteContact(selectedCompany.id, id);
      setCompanyContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's company (always needed)
        const company = await apiService.getUserCompany();
        setCompanies([company]);
        setSelectedCompany(company);
        setCompanyForm({
          full_name: company.full_name,
          address: company.address || '',
          city: company.city || '',
          postal_code: company.postal_code || '',
          country: company.country || '',
          status: company.status
        });

        // Initialize business hours with default values if none exist
        try {
          const hoursResponse = await apiService.getCompanyHours(company.id);
          if (hoursResponse.hours && hoursResponse.hours.length > 0) {
            setCompanyHours(hoursResponse.hours);
          } else {
            // Set default business hours (Monday-Sunday, 9 AM - 5 PM)
            const defaultHours = Array.from({ length: 7 }, (_, i) => ({
              day_of_week: i + 1,
              open_time: '09:00',
              close_time: '17:00',
              is_closed: false
            }));
            setCompanyHours(defaultHours);
          }
        } catch (err) {
          console.warn('Could not load business hours, using defaults');
          // Set default business hours
          const defaultHours = Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i + 1,
            open_time: '09:00',
            close_time: '17:00',
            is_closed: false
          }));
          setCompanyHours(defaultHours);
        }

      } catch (err: any) {
        console.error('Error fetching company data:', err);
        setError(err.message || 'Failed to fetch company data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Function to handle tab change and lazy loading
  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);
    
    // If tab hasn't been loaded yet, load it
    if (!loadedTabs.has(tabId) && selectedCompany) {
      await loadTabData(tabId);
    }
  };

  // Function to load data for a specific tab
  const loadTabData = async (tabId: string) => {
    if (!selectedCompany || loadedTabs.has(tabId)) return;

    try {
      setLoadingTabs(prev => new Set(prev).add(tabId));
      setError(null);

      switch (tabId) {
        case 'hours':
          const hoursResponse = await apiService.getCompanyHours(selectedCompany.id);
          setCompanyHours(hoursResponse.hours);
          break;
        
        case 'social':
          const socialsResponse = await apiService.listCompanySocials(selectedCompany.id);
          setCompanySocials(socialsResponse.socials);
          break;
        
        case 'gallery':
          const galleryResponse = await apiService.listCompanyGallery(selectedCompany.id);
          setCompanyGallery(galleryResponse.gallery);
          break;
        
        case 'documents':
          const documentsResponse = await apiService.listCompanyDocuments(selectedCompany.id);
          setCompanyDocuments(documentsResponse.documents);
          break;
        
        case 'zones':
          const zonesResponse = await apiService.listDeliveryZones(selectedCompany.id);
          setDeliveryZones(zonesResponse.zones);
          break;
        
        case 'branches':
          const branchesResponse = await apiService.listBranches(selectedCompany.id);
          setCompanyBranches(branchesResponse.branches);
          break;
        
        case 'contacts':
          const contactsResponse = await apiService.listContacts(selectedCompany.id);
          setCompanyContacts(contactsResponse.contacts);
          break;
      }

      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add(tabId));
    } catch (err: any) {
      console.error(`Error loading ${tabId} data:`, err);
      setError(err.message || `Failed to load ${tabId} data`);
    } finally {
      setLoadingTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
            <p className="text-gray-600">Please select a company to manage.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-1">Manage {selectedCompany.full_name}</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: Building2 },
                { id: 'hours', label: 'Business Hours', icon: Clock },
                { id: 'social', label: 'Social Media', icon: Share2 },
                { id: 'gallery', label: 'Gallery', icon: ImageIcon },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'zones', label: 'Delivery Zones', icon: Map },
                { id: 'branches', label: 'Branches', icon: MapPin },
                { id: 'contacts', label: 'Contacts', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Company Profile</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCompanyUpdate(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyForm.full_name}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={companyForm.city}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={companyForm.postal_code}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={companyForm.country}
                        onChange={(e) => setCompanyForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Company
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedCompany.full_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      selectedCompany.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedCompany.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedCompany.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedCompany.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">City</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedCompany.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Postal Code</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedCompany.postal_code || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Country</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedCompany.country || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business Hours Tab */}
          {activeTab === 'hours' && (
            <div>
              {loadingTabs.has('hours') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading business hours...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Business Hours</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? 'Cancel' : 'Edit Hours'}
                    </button>
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateHours(); }} className="space-y-4">
                      <div className="space-y-4">
                        {companyHours.map((hour, index) => (
                          <div key={hour.day_of_week} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-24">
                                <span className="text-sm font-medium text-gray-700">{dayNames[hour.day_of_week - 1]}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={hour.open_time}
                                  onChange={(e) => {
                                    const newHours = [...companyHours];
                                    newHours[index] = { ...hour, open_time: e.target.value };
                                    setCompanyHours(newHours);
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="time"
                                  value={hour.close_time}
                                  onChange={(e) => {
                                    const newHours = [...companyHours];
                                    newHours[index] = { ...hour, close_time: e.target.value };
                                    setCompanyHours(newHours);
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={hour.is_closed}
                                  onChange={(e) => {
                                    const newHours = [...companyHours];
                                    newHours[index] = { ...hour, is_closed: e.target.checked };
                                    setCompanyHours(newHours);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Closed</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Update Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {companyHours.map((hour, index) => (
                        <div key={hour.day_of_week} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                          <div className="w-24">
                            <span className="text-sm font-medium text-gray-700">{dayNames[hour.day_of_week - 1]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{hour.open_time} - {hour.close_time}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            hour.is_closed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {hour.is_closed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div>
              {loadingTabs.has('social') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading social media...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Social Media</h2>
                    <button
                      onClick={() => setShowAddSocial(!showAddSocial)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Social Media
                    </button>
                  </div>
                  
                  {showAddSocial && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Social Media</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                          <input
                            type="text"
                            value={socialForm.platform}
                            onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value }))}
                            placeholder="e.g., Facebook, Instagram, Twitter"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                          <input
                            type="url"
                            value={socialForm.url}
                            onChange={(e) => setSocialForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddSocial}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add Social Media
                        </button>
                        <button
                          onClick={() => setShowAddSocial(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companySocials.map((social) => (
                      <div key={social.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{social.platform}</h4>
                          <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {social.url}
                          </a>
                        </div>
                        <button
                          onClick={() => handleDeleteSocial(social.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              {loadingTabs.has('gallery') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading gallery...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Company Gallery</h2>
                    <button
                      onClick={() => setShowAddGallery(!showAddGallery)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Image
                    </button>
                  </div>
                  
                  {showAddGallery && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Image</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setGalleryForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddGallery}
                          disabled={uploading || !galleryForm.file}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Image'}
                        </button>
                        <button
                          onClick={() => setShowAddGallery(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {companyGallery.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.path}
                          alt="Gallery"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteGallery(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {loadingTabs.has('documents') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading documents...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Company Documents</h2>
                    <button
                      onClick={() => setShowAddDocument(!showAddDocument)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Document
                    </button>
                  </div>
                  
                  {showAddDocument && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Document</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                          <input
                            type="text"
                            value={documentForm.doc_type}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, doc_type: e.target.value }))}
                            placeholder="e.g., Business License, Tax Certificate"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddDocument}
                          disabled={uploading || !documentForm.doc_type || !documentForm.file}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Document'}
                        </button>
                        <button
                          onClick={() => setShowAddDocument(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyDocuments.map((document) => (
                      <div key={document.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{document.doc_type}</h4>
                          <p className="text-sm text-gray-500">Status: {document.status}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivery Zones Tab */}
          {activeTab === 'zones' && (
            <div>
              {loadingTabs.has('zones') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading delivery zones...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Delivery Zones</h2>
                    <button
                      onClick={() => setShowAddZone(!showAddZone)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Zone
                    </button>
                  </div>
                  
                  {showAddZone && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Delivery Zone</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                          <input
                            type="text"
                            value={zoneForm.name}
                            onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Downtown, North Area"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zone Type</label>
                          <select
                            value={zoneForm.zone_type}
                            onChange={(e) => setZoneForm(prev => ({ ...prev, zone_type: e.target.value as 'radius' | 'polygon' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="radius">Radius</option>
                            <option value="polygon">Polygon</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Center Latitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={zoneForm.center_lat}
                            onChange={(e) => setZoneForm(prev => ({ ...prev, center_lat: e.target.value }))}
                            placeholder="e.g., 40.7128"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Center Longitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={zoneForm.center_lng}
                            onChange={(e) => setZoneForm(prev => ({ ...prev, center_lng: e.target.value }))}
                            placeholder="e.g., -74.0060"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {zoneForm.zone_type === 'radius' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
                            <input
                              type="number"
                              value={zoneForm.radius_m}
                              onChange={(e) => setZoneForm(prev => ({ ...prev, radius_m: e.target.value }))}
                              placeholder="e.g., 5000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddZone}
                          disabled={!zoneForm.name}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add Zone
                        </button>
                        <button
                          onClick={() => setShowAddZone(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deliveryZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{zone.name}</h4>
                          <p className="text-sm text-gray-500">Type: {zone.zone_type}</p>
                          {zone.zone_type === 'radius' && zone.radius_m && (
                            <p className="text-sm text-gray-500">Radius: {zone.radius_m}m</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div>
              {loadingTabs.has('branches') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading branches...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Company Branches</h2>
                    <button
                      onClick={() => setShowAddBranch(!showAddBranch)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Branch
                    </button>
                  </div>
                  
                  {showAddBranch && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Branch</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={branchForm.branch_name}
                            onChange={(e) => setBranchForm(prev => ({ ...prev, branch_name: e.target.value }))}
                            placeholder="e.g., Downtown Branch, North Location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Address</label>
                          <input
                            type="text"
                            value={branchForm.branch_address}
                            onChange={(e) => setBranchForm(prev => ({ ...prev, branch_address: e.target.value }))}
                            placeholder="e.g., 123 Main St, City, State"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBranchForm(prev => ({ ...prev, branch_image: e.target.files?.[0] || null }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddBranch}
                          disabled={!branchForm.branch_name}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add Branch
                        </button>
                        <button
                          onClick={() => setShowAddBranch(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyBranches.map((branch) => (
                      <div key={branch.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{branch.branch_name}</h4>
                          <p className="text-sm text-gray-500">{branch.branch_address || 'No address specified'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              {loadingTabs.has('contacts') ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading contacts...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Company Contacts</h2>
                    <button
                      onClick={() => setShowAddContact(!showAddContact)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </button>
                  </div>
                  
                  {showAddContact && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Add New Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="e.g., +1-555-123-4567"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="e.g., contact@company.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            value={contactForm.address}
                            onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="e.g., 123 Business St, City, State, ZIP"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleAddContact}
                          disabled={!contactForm.phone && !contactForm.email && !contactForm.address}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add Contact
                        </button>
                        <button
                          onClick={() => setShowAddContact(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          {contact.phone && (
                            <p className="text-sm text-gray-900 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-gray-900 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </p>
                          )}
                          {contact.address && (
                            <p className="text-sm text-gray-900 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {contact.address}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;
