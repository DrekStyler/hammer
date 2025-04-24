// CommonStyles.js - Reusable inline styles for the application

// Color palette
const colors = {
  primary: '#1a73e8',
  primaryDark: '#0d47a1',
  success: '#34A853',
  error: '#EA4335',
  warning: '#FBBC05',
  info: '#4285F4',
  pending: '#F9AB00',
  neutral: '#9AA0A6',
  text: {
    primary: '#202124',
    secondary: '#5f6368',
    light: '#757575',
  },
  background: {
    main: '#ffffff',
    light: '#f8f9fa',
    dark: '#f1f3f4',
  },
  border: '#e0e0e0',
  divider: '#eeeeee',
};

// Typography
const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  h1: {
    fontSize: '28px',
    fontWeight: '600',
    color: colors.text.primary,
    margin: '0 0 24px 0',
  },
  h2: {
    fontSize: '22px',
    fontWeight: '500',
    color: colors.text.primary,
    margin: '0 0 16px 0',
  },
  h3: {
    fontSize: '18px',
    fontWeight: '500',
    color: colors.text.primary,
    margin: '0 0 16px 0',
  },
  body: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: colors.text.primary,
    lineHeight: '1.5',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  small: {
    fontSize: '12px',
    color: colors.text.light,
  },
};

// Layout containers
const layout = {
  page: {
    padding: '30px',
    maxWidth: '1600px',
    margin: '0 auto',
    fontFamily: typography.fontFamily,
  },
  section: {
    backgroundColor: colors.background.main,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    padding: '20px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: colors.background.main,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.background.light,
  },
  cardContent: {
    padding: '20px',
  },
  cardFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.background.light,
  },
  flex: {
    display: 'flex',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gap: '16px',
  },
};

// Form elements
const forms = {
  input: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '16px',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: colors.primary,
    outline: 'none',
    boxShadow: `0 0 0 2px ${colors.primary}33`,
  },
  select: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '16px',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    backgroundColor: colors.background.main,
  },
  textarea: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '16px',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    minHeight: '100px',
    resize: 'vertical',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: colors.text.secondary,
  },
  formGroup: {
    marginBottom: '20px',
  },
};

// Buttons
const buttons = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primary: {
    backgroundColor: colors.primary,
    color: 'white',
  },
  secondary: {
    backgroundColor: colors.background.light,
    color: colors.text.primary,
    border: `1px solid ${colors.border}`,
  },
  success: {
    backgroundColor: colors.success,
    color: 'white',
  },
  danger: {
    backgroundColor: colors.error,
    color: 'white',
  },
  warning: {
    backgroundColor: colors.warning,
    color: 'white',
  },
  link: {
    backgroundColor: 'transparent',
    color: colors.primary,
    padding: '0',
    textDecoration: 'none',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    padding: '0',
  },
};

// Tables
const tables = {
  container: {
    width: '100%',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderSpacing: '0',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    position: 'sticky',
    top: '0',
    backgroundColor: colors.background.light,
    padding: '16px',
    textAlign: 'left',
    color: colors.text.secondary,
    fontWeight: '500',
    borderBottom: `1px solid ${colors.border}`,
  },
  tableHeaderHover: {
    backgroundColor: colors.background.dark,
  },
  tableCell: {
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.divider}`,
    color: colors.text.primary,
    verticalAlign: 'middle',
  },
  tableRow: {
    transition: 'background-color 0.2s',
  },
  tableRowHover: {
    backgroundColor: `${colors.primary}08`,
  },
  evenRow: {
    backgroundColor: colors.background.main,
  },
  oddRow: {
    backgroundColor: colors.background.light,
  },
};

// Status badges
const statusBadges = {
  base: {
    display: 'inline-block',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '16px',
    textTransform: 'capitalize',
    textAlign: 'center',
    minWidth: '90px',
    color: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  inProgress: {
    backgroundColor: colors.info,
  },
  completed: {
    backgroundColor: colors.success,
  },
  cancelled: {
    backgroundColor: colors.error,
  },
  onHold: {
    backgroundColor: colors.warning,
  },
  pending: {
    backgroundColor: colors.pending,
  },
  draft: {
    backgroundColor: colors.neutral,
  },
};

// Loading and error states
const feedback = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  loadingSpinner: {
    fontSize: '32px',
    color: colors.primary,
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: colors.text.secondary,
  },
  errorMessage: {
    backgroundColor: `${colors.error}22`,
    color: colors.error,
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
  },
  successMessage: {
    backgroundColor: `${colors.success}22`,
    color: colors.success,
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
  },
  noResults: {
    textAlign: 'center',
    padding: '30px',
    color: colors.text.light,
    fontSize: '16px',
    backgroundColor: colors.background.light,
    borderRadius: '4px',
    margin: '10px 0',
  },
};

// Modal styles
const modals = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: colors.background.main,
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    padding: '20px',
  },
  footer: {
    padding: '16px 20px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
};

// Export all styles
const CommonStyles = {
  colors,
  typography,
  layout,
  forms,
  buttons,
  tables,
  statusBadges,
  feedback,
  modals,
};

export default CommonStyles; 