import { useState, useEffect } from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'

const routes = [
  { path: '/', label: 'Pools' },
  { path: '/create-pool', label: 'Create Pool' },
  { path: '/create-option', label: 'Create Option' },
] as const

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [value, setValue] = useState(0)

  useEffect(() => {
    const index = routes.findIndex(route => route.path === location.pathname)
    setValue(index >= 0 ? index : 0)
  }, [location])

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    navigate(routes[newValue].path)
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={value} 
        onChange={handleChange}
        textColor="secondary"
        indicatorColor="secondary"
        variant="fullWidth"
      >
        {routes.map(route => (
          <Tab 
            key={route.path} 
            label={route.label}
            sx={{ 
              fontSize: '1rem',
              fontWeight: 'medium',
              textTransform: 'none'
            }}
          />
        ))}
      </Tabs>
    </Box>
  )
}