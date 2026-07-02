import type { AccountStatus, DocCategory, UserRole } from '@/lib/types';

export type Lang = 'en' | 'tl';

export const LANG_COOKIE = 'lang';

const en = {
  nav: {
    about: 'About',
    memberLogin: 'Member Login',
    overview: 'Overview',
    documents: 'Documents',
    approvals: 'Approvals',
    upload: 'Upload',
    members: 'Members',
    signOut: 'Sign out',
    toggleTheme: 'Toggle dark mode',
    switchLanguage: 'Switch language',
  },
  footer: {
    rights: 'All rights reserved.',
    location: 'Calamba City, Laguna, Philippines',
  },
  landing: {
    badge: 'The Official Community Portal',
    heroPrefix: 'Welcome to',
    heroSub:
      'Your secure digital hub for community notices, official announcements, and homeowners association services — built for verified residents of Ciudad Verde Calamba.',
    ctaPortal: 'Access Member Portal',
    ctaRegister: 'Register as Homeowner',
    f1Title: 'Official Documents',
    f1Desc: 'Notices and announcements with tamper-proof tracking numbers.',
    f2Title: 'Verified Members Only',
    f2Desc: 'Every account is approved by HOA officers before activation.',
    f3Title: 'Community Directory',
    f3Desc:
      'A living record of homeowners across every phase, block, and lot.',
    aboutTitle: 'About Ciudad Verde Calamba',
    aboutBody:
      'Ciudad Verde Calamba is a thriving residential community nestled in Calamba City, Laguna — at the foot of the historic Mount Makiling. Our homeowners association exists to protect the interests of every resident, maintain the beauty and safety of our shared spaces, and foster a genuine sense of neighborhood. Through this portal, the association delivers transparent, accountable, and timely communication to every verified homeowner.',
    missionTitle: 'Our Mission',
    missionBody:
      'To serve the homeowners of Ciudad Verde Calamba with integrity and transparency — safeguarding community assets, enforcing fair and consistent policies, and ensuring that every resident has timely access to official notices, decisions, and services that affect their home and family.',
    visionTitle: 'Our Vision',
    visionBody:
      'A model green community in Laguna where neighbors are connected, informed, and empowered — a Ciudad Verde where responsible governance, environmental stewardship, and Filipino bayanihan spirit make every street a safe and welcoming place to live.',
    ctaTitle: 'Are you a homeowner of Ciudad Verde Calamba?',
    ctaBody:
      'Register with your Phase, Block, and Lot details. Once verified by the HOA officers, you will receive full access to the member portal.',
    ctaButton: 'Create Your Account',
  },
  auth: {
    loginTitle: 'Member Login',
    registerTitle: 'Homeowner Registration',
    loginDesc: 'Sign in to access the community portal.',
    registerDesc:
      'Register with your property details. HOA officers will verify and approve your account.',
    tabLogin: 'Login',
    tabRegister: 'Register',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phase: 'Phase',
    block: 'Block',
    lot: 'Lot',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    submit: 'Submit Registration',
    submitting: 'Submitting...',
    minChars: 'Minimum 8 characters.',
    approvalNote:
      'New accounts require approval by the HOA President or Vice President before you can sign in.',
    bannerUnauthorized:
      'Your session was ended because your account is not active (pending approval or deactivated). Please contact the HOA office if you believe this is a mistake.',
  },
  overview: {
    welcome: 'Welcome back',
    signedInAs: 'You are signed in as',
    pendingOne: 'registration awaiting your decision.',
    pendingMany: 'registrations awaiting your decision.',
    reviewNow: 'Review now',
    recent: 'Recent Community Notices',
    viewAll: 'View all',
    emptyTitle: 'No published documents yet',
    emptyBody:
      'Official notices and announcements will appear here once published by the HOA.',
    published: 'Published',
    minutesNote:
      'Note: Board Minutes of Meetings are restricted to board-level members and are not shown in your feed.',
  },
  docs: {
    title: 'Document Repository',
    subtitle:
      'Official HOA notices, announcements, and records — searchable by title, tracking number, or category.',
    searchPlaceholder:
      'Search by title or tracking number (e.g. CV-NOTICE-2026-001)...',
    allCategories: 'All categories',
    published: 'Published',
    pending: 'Pending Review',
    open: 'Open',
    publish: 'Publish',
    publishing: 'Publishing...',
    publishedOn: 'Published',
    uploadedOn: 'Uploaded',
    emptyTitle: 'No documents found',
    emptyNone: 'Nothing has been published yet.',
    emptyFilter: 'Try a different search term or category filter.',
  },
  docDetail: {
    back: 'Back to Documents',
    download: 'Download',
    downloadDocument: 'Download Document',
    publishBtn: 'Approve & Publish',
    publishNote:
      'Publishing makes this document visible to authorized members. If email notification was requested at upload, the broadcast is sent now.',
    trackingNo: 'Tracking No.',
    uploaded: 'Uploaded',
    published: 'Published',
    file: 'File',
    size: 'Size',
    uploadedBy: 'Uploaded by',
    broadcast: 'Broadcast',
    queued: 'Queued for publish',
    sent: 'Sent',
    noPreview: 'Word documents cannot be previewed in the browser.',
    unavailableTitle: 'File unavailable',
    unavailableBody:
      'The stored file could not be located. Contact the document controller.',
  },
  approvals: {
    title: 'Membership Approvals',
    subtitle:
      'Review incoming registrations, verify Phase/Block/Lot details, and assign the appropriate role tier.',
    emptyTitle: 'The approval queue is empty',
    emptyBody:
      'New registrations will appear here and you will also be notified by email.',
    colApplicant: 'Applicant',
    colEmail: 'Email',
    colProperty: 'Phase / Block / Lot',
    colRegistered: 'Registered',
    colRole: 'Assign Role',
    colDecision: 'Decision',
    approve: 'Approve',
    deny: 'Deny',
    approvedAs: 'approved as',
    deniedFor: 'Registration denied for',
    denyTitle: 'Deny this registration?',
    denyLead: 'This permanently removes the registration of',
    denyTail: 'They can register again later if this was a mistake.',
    cancel: 'Cancel',
    denyConfirm: 'Deny Registration',
  },
  members: {
    title: 'Community Directory',
    subtitle:
      'The complete homeowner roster. Account activation and deactivation is reserved for the System Admin and President.',
    searchPlaceholder: 'Search by name, email, or phase-block-lot...',
    colMember: 'Member',
    colEmail: 'Email',
    colProperty: 'Property',
    colRole: 'Role',
    colStatus: 'Status',
    colManage: 'Manage',
    protected: 'Protected',
    protectedHint: 'This account is outside your management authority.',
    accountStatus: 'Account Status',
    activate: 'Activate account',
    deactivate: 'Deactivate account',
    you: '(you)',
    confirmActivateTitle: 'Activate this account?',
    confirmDeactivateTitle: 'Deactivate this account?',
    deactivateBody:
      'their record is retained for audit purposes, but they will immediately lose portal access and any active session will be terminated.',
    activateBody:
      'they will regain full portal access according to their role.',
    cancel: 'Cancel',
    activateBtn: 'Activate',
    deactivateBtn: 'Deactivate',
    noMatch: 'No members match your search.',
  },
  uploadPage: {
    title: 'Upload Document',
    subtitle:
      'Stage a new notice, announcement, or minutes of meeting. Uploads enter the review queue and go live once published by the President or Vice President.',
    cardTitle: 'Document Details',
    cardDesc: 'Accepted formats: PDF, DOCX, PNG, JPG — maximum 10MB.',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Water Interruption Advisory — July 2026',
    category: 'Category',
    selectCategory: 'Select a category',
    momWarning:
      'Minutes of Meeting are restricted — regular members will never see or be notified about this document.',
    file: 'File',
    maxSize: 'Max size: 10MB.',
    notifyLabel: 'Send email notification to members upon approval',
    notifyDesc:
      'When the President or VP publishes this document, every active member with clearance for this category receives an email with a direct link. Leave unchecked to publish silently.',
    submitBtn: 'Stage Document for Review',
    uploading: 'Uploading...',
  },
  roles: {
    sys_admin: 'System Admin',
    president: 'President',
    vice_president: 'Vice President',
    doc_controller: 'Document Controller',
    board_member: 'Board Member',
    regular_member: 'Regular Member',
  } as Record<UserRole, string>,
  statuses: {
    pending_approval: 'Pending Approval',
    active: 'Active',
    deactivated: 'Deactivated',
  } as Record<AccountStatus, string>,
  categories: {
    Notice: 'Notice',
    Announcement: 'Announcement',
    'Minutes of Meeting': 'Minutes of Meeting',
  } as Record<DocCategory, string>,
};

export type Dict = typeof en;

const tl: Dict = {
  nav: {
    about: 'Tungkol',
    memberLogin: 'Login ng Miyembro',
    overview: 'Pangkalahatan',
    documents: 'Mga Dokumento',
    approvals: 'Mga Pag-apruba',
    upload: 'Mag-upload',
    members: 'Mga Miyembro',
    signOut: 'Mag-sign out',
    toggleTheme: 'I-toggle ang dark mode',
    switchLanguage: 'Palitan ang wika',
  },
  footer: {
    rights: 'Lahat ng karapatan ay nakalaan.',
    location: 'Lungsod ng Calamba, Laguna, Pilipinas',
  },
  landing: {
    badge: 'Ang Opisyal na Portal ng Komunidad',
    heroPrefix: 'Maligayang pagdating sa',
    heroSub:
      'Ang inyong ligtas na digital na tahanan para sa mga abiso ng komunidad, opisyal na anunsyo, at serbisyo ng samahan ng mga may-ari ng bahay, para sa mga beripikadong residente ng Ciudad Verde Calamba.',
    ctaPortal: 'Pumasok sa Member Portal',
    ctaRegister: 'Magparehistro bilang May-ari ng Bahay',
    f1Title: 'Mga Opisyal na Dokumento',
    f1Desc:
      'Mga abiso at anunsyo na may tracking number na hindi mapapalsipika.',
    f2Title: 'Para sa Beripikadong Miyembro Lamang',
    f2Desc:
      'Bawat account ay inaaprubahan ng mga opisyal ng HOA bago ma-activate.',
    f3Title: 'Direktoryo ng Komunidad',
    f3Desc:
      'Buhay na talaan ng mga may-ari ng bahay sa bawat phase, block, at lot.',
    aboutTitle: 'Tungkol sa Ciudad Verde Calamba',
    aboutBody:
      'Ang Ciudad Verde Calamba ay isang masiglang residensyal na komunidad sa Lungsod ng Calamba, Laguna, sa paanan ng makasaysayang Bundok Makiling. Layunin ng aming samahan na protektahan ang interes ng bawat residente, panatilihin ang kagandahan at kaligtasan ng ating mga pinagsasaluhang espasyo, at palaganapin ang tunay na diwa ng pagkakapitbahay. Sa pamamagitan ng portal na ito, naghahatid ang samahan ng malinaw, responsable, at napapanahong komunikasyon sa bawat beripikadong may-ari ng bahay.',
    missionTitle: 'Ang Aming Misyon',
    missionBody:
      'Paglingkuran ang mga may-ari ng bahay ng Ciudad Verde Calamba nang may integridad at transparency: pangalagaan ang mga ari-arian ng komunidad, ipatupad ang patas at pare-parehong mga patakaran, at tiyaking may napapanahong access ang bawat residente sa mga opisyal na abiso, desisyon, at serbisyong nakakaapekto sa kanilang tahanan at pamilya.',
    visionTitle: 'Ang Aming Bisyon',
    visionBody:
      'Isang huwarang luntiang komunidad sa Laguna kung saan ang magkakapitbahay ay konektado, may kaalaman, at may kakayahan: isang Ciudad Verde kung saan ang responsableng pamamahala, pangangalaga sa kalikasan, at diwa ng bayanihan ang gumagawa sa bawat kalye na ligtas at malugod na tahanan.',
    ctaTitle: 'Ikaw ba ay may-ari ng bahay sa Ciudad Verde Calamba?',
    ctaBody:
      'Magparehistro gamit ang detalye ng inyong Phase, Block, at Lot. Kapag na-verify na ng mga opisyal ng HOA, magkakaroon kayo ng buong access sa member portal.',
    ctaButton: 'Gumawa ng Inyong Account',
  },
  auth: {
    loginTitle: 'Login ng Miyembro',
    registerTitle: 'Rehistrasyon ng May-ari ng Bahay',
    loginDesc: 'Mag-sign in upang ma-access ang portal ng komunidad.',
    registerDesc:
      'Magparehistro gamit ang detalye ng inyong ari-arian. Beberipikahin at aaprubahan ng mga opisyal ng HOA ang inyong account.',
    tabLogin: 'Login',
    tabRegister: 'Rehistro',
    email: 'Email',
    password: 'Password',
    firstName: 'Pangalan',
    lastName: 'Apelyido',
    phase: 'Phase',
    block: 'Block',
    lot: 'Lot',
    signIn: 'Mag-sign In',
    signingIn: 'Nagsa-sign in...',
    submit: 'Ipasa ang Rehistrasyon',
    submitting: 'Ipinapasa...',
    minChars: 'Hindi bababa sa 8 karakter.',
    approvalNote:
      'Ang mga bagong account ay nangangailangan ng pag-apruba ng HOA President o Vice President bago kayo makapag-sign in.',
    bannerUnauthorized:
      'Natapos ang inyong session dahil hindi aktibo ang inyong account (naghihintay ng pag-apruba o na-deactivate). Makipag-ugnayan sa opisina ng HOA kung sa tingin ninyo ay pagkakamali ito.',
  },
  overview: {
    welcome: 'Maligayang pagbabalik',
    signedInAs: 'Naka-sign in kayo bilang',
    pendingOne: 'rehistrasyong naghihintay ng inyong desisyon.',
    pendingMany: 'mga rehistrasyong naghihintay ng inyong desisyon.',
    reviewNow: 'Suriin ngayon',
    recent: 'Mga Bagong Abiso ng Komunidad',
    viewAll: 'Tingnan lahat',
    emptyTitle: 'Wala pang nailathalang dokumento',
    emptyBody:
      'Dito lalabas ang mga opisyal na abiso at anunsyo kapag nailathala na ng HOA.',
    published: 'Nailathala',
    minutesNote:
      'Paalala: Ang Minutes of Meeting ng Board ay para lamang sa mga miyembro ng board at hindi lalabas sa inyong feed.',
  },
  docs: {
    title: 'Imbakan ng mga Dokumento',
    subtitle:
      'Mga opisyal na abiso, anunsyo, at talaan ng HOA. Maghanap ayon sa pamagat, tracking number, o kategorya.',
    searchPlaceholder:
      'Maghanap ayon sa pamagat o tracking number (hal. CV-NOTICE-2026-001)...',
    allCategories: 'Lahat ng kategorya',
    published: 'Nailathala',
    pending: 'Hinihintay ang Pagsusuri',
    open: 'Buksan',
    publish: 'Ilathala',
    publishing: 'Inilalathala...',
    publishedOn: 'Nailathala',
    uploadedOn: 'Na-upload',
    emptyTitle: 'Walang nahanap na dokumento',
    emptyNone: 'Wala pang nailalathala.',
    emptyFilter: 'Sumubok ng ibang salita o kategorya.',
  },
  docDetail: {
    back: 'Bumalik sa Mga Dokumento',
    download: 'I-download',
    downloadDocument: 'I-download ang Dokumento',
    publishBtn: 'Aprubahan at Ilathala',
    publishNote:
      'Kapag inilathala, makikita na ito ng mga awtorisadong miyembro. Kung hiniling ang email na abiso sa pag-upload, ipapadala na ang broadcast ngayon.',
    trackingNo: 'Tracking No.',
    uploaded: 'Na-upload',
    published: 'Nailathala',
    file: 'File',
    size: 'Laki',
    uploadedBy: 'Na-upload ni',
    broadcast: 'Broadcast',
    queued: 'Nakapila sa paglalathala',
    sent: 'Naipadala',
    noPreview: 'Hindi ma-preview ang mga Word document sa browser.',
    unavailableTitle: 'Hindi available ang file',
    unavailableBody:
      'Hindi mahanap ang nakaimbak na file. Makipag-ugnayan sa document controller.',
  },
  approvals: {
    title: 'Pag-apruba ng mga Miyembro',
    subtitle:
      'Suriin ang mga papasok na rehistrasyon, i-verify ang detalye ng Phase/Block/Lot, at magtalaga ng angkop na role.',
    emptyTitle: 'Walang nakapilang rehistrasyon',
    emptyBody:
      'Dito lalabas ang mga bagong rehistrasyon at aabisuhan din kayo sa pamamagitan ng email.',
    colApplicant: 'Aplikante',
    colEmail: 'Email',
    colProperty: 'Phase / Block / Lot',
    colRegistered: 'Nairehistro',
    colRole: 'Italaga ang Role',
    colDecision: 'Desisyon',
    approve: 'Aprubahan',
    deny: 'Tanggihan',
    approvedAs: 'ay inaprubahan bilang',
    deniedFor: 'Tinanggihan ang rehistrasyon ni',
    denyTitle: 'Tanggihan ang rehistrasyong ito?',
    denyLead: 'Permanenteng aalisin nito ang rehistrasyon ni',
    denyTail: 'Maaari silang magparehistro muli kung ito ay pagkakamali.',
    cancel: 'Kanselahin',
    denyConfirm: 'Tanggihan ang Rehistrasyon',
  },
  members: {
    title: 'Direktoryo ng Komunidad',
    subtitle:
      'Ang kumpletong talaan ng mga may-ari ng bahay. Ang pag-activate at pag-deactivate ng account ay para lamang sa System Admin at President.',
    searchPlaceholder:
      'Maghanap ayon sa pangalan, email, o phase-block-lot...',
    colMember: 'Miyembro',
    colEmail: 'Email',
    colProperty: 'Ari-arian',
    colRole: 'Role',
    colStatus: 'Katayuan',
    colManage: 'Pamahalaan',
    protected: 'Protektado',
    protectedHint: 'Ang account na ito ay wala sa saklaw ng inyong awtoridad.',
    accountStatus: 'Katayuan ng Account',
    activate: 'I-activate ang account',
    deactivate: 'I-deactivate ang account',
    you: '(ikaw)',
    confirmActivateTitle: 'I-activate ang account na ito?',
    confirmDeactivateTitle: 'I-deactivate ang account na ito?',
    deactivateBody:
      'mananatili ang kanilang talaan para sa audit, ngunit agad silang mawawalan ng access sa portal at matatapos ang kanilang aktibong session.',
    activateBody:
      'muli silang magkakaroon ng buong access sa portal ayon sa kanilang role.',
    cancel: 'Kanselahin',
    activateBtn: 'I-activate',
    deactivateBtn: 'I-deactivate',
    noMatch: 'Walang miyembrong tumugma sa inyong paghahanap.',
  },
  uploadPage: {
    title: 'Mag-upload ng Dokumento',
    subtitle:
      'Maglagay ng bagong abiso, anunsyo, o katitikan ng pulong. Papasok ito sa review queue at malalathala kapag inaprubahan ng President o Vice President.',
    cardTitle: 'Detalye ng Dokumento',
    cardDesc: 'Tinatanggap: PDF, DOCX, PNG, JPG. Hanggang 10MB.',
    titleLabel: 'Pamagat',
    titlePlaceholder: 'hal. Abiso sa Pagkaantala ng Tubig, Hulyo 2026',
    category: 'Kategorya',
    selectCategory: 'Pumili ng kategorya',
    momWarning:
      'Limitado ang Minutes of Meeting. Hindi ito makikita o mapapadalhan ng abiso ang mga regular na miyembro.',
    file: 'File',
    maxSize: 'Pinakamalaking laki: 10MB.',
    notifyLabel:
      'Magpadala ng email na abiso sa mga miyembro kapag naaprubahan',
    notifyDesc:
      'Kapag inilathala ng President o VP ang dokumentong ito, bawat aktibong miyembrong may clearance sa kategoryang ito ay makakatanggap ng email na may direktang link. Iwanang blanko upang ilathala nang tahimik.',
    submitBtn: 'Ipasa para sa Pagsusuri',
    uploading: 'Ina-upload...',
  },
  roles: {
    sys_admin: 'System Admin',
    president: 'Presidente',
    vice_president: 'Bise Presidente',
    doc_controller: 'Tagapamahala ng Dokumento',
    board_member: 'Miyembro ng Board',
    regular_member: 'Regular na Miyembro',
  },
  statuses: {
    pending_approval: 'Naghihintay ng Pag-apruba',
    active: 'Aktibo',
    deactivated: 'Na-deactivate',
  },
  categories: {
    Notice: 'Abiso',
    Announcement: 'Anunsyo',
    'Minutes of Meeting': 'Katitikan ng Pulong',
  },
};

export const dictionaries: Record<Lang, Dict> = { en, tl };

export function getDict(lang: Lang): Dict {
  return dictionaries[lang];
}
