  "use client"
  import type React from "react"
  import { DialogFooter } from "@/components/ui/dialog"
  import { useRouter } from "next/navigation"

  import { useState, useEffect } from "react"
  import { onAuthStateChanged, createUserWithEmailAndPassword, signOut, type User } from "firebase/auth"
  import { ref, onValue, set, remove, update, push } from "firebase/database"
  import { auth, database } from "@/lib/firebase"
  import type { UserProfile, DriverRegistration } from "@/types"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Badge } from "@/components/ui/badge"
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
  import { Checkbox } from "@/components/ui/checkbox"
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import {
    Trash2,
    UserPlus,
    Shield,
    Edit,
    Power,
    PowerOff,
    Settings,
    UserIcon,
    LogOut,
    Eye,
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Users,
    Car,
    BarChart3,
    EyeOff,
    ChevronDown,
  } from "lucide-react"
  import * as XLSX from "xlsx"
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible" // Added Collapsible imports

  export default function ManagerPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    // Manager states
    const [managers, setManagers] = useState<UserProfile[]>([])
    // Director states - add new state for directors
    const [directors, setDirectors] = useState<UserProfile[]>([])
    // Driver states - add after managers states
    const [drivers, setDrivers] = useState<UserProfile[]>([])
    // Report states
    const [reportRecords, setReportRecords] = useState<any[]>([])
    const [filteredReportRecords, setFilteredReportRecords] = useState<any[]>([])
    const [reportFilterYear, setReportFilterYear] = useState("")
    const [reportFilterMonth, setReportFilterMonth] = useState("")
    const [reportFilterCarNumber, setReportFilterCarNumber] = useState("")
    const [reportFilterMechanic, setReportFilterMechanic] = useState("")
    const [reportFilterPaymentStatus, setReportFilterPaymentStatus] = useState("") // New filter
    const [reportLoading, setReportLoading] = useState(false)
    const [totalCashAmount, setTotalCashAmount] = useState(0)
    const [totalCardAmount, setTotalCardAmount] = useState(0)
    const [totalTransferAmount, setTotalTransferAmount] = useState(0)
    // Enhanced Dashboard states
    const [dashboardStats, setDashboardStats] = useState({
      totalCustomers: 0,
      totalRevenue: 0,
      activeRecords: 0,
      todayCustomers: 0,
      todayRevenue: 0,
      averageSessionTime: 0,
      averageRevenue: 0,
    })
    const [monthlyStats, setMonthlyStats] = useState<any[]>([])
    const [dailyStats, setDailyStats] = useState<any[]>([])
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [dashboardLoading, setDashboardLoading] = useState(false)
    // Add these new states for custom date range
    const [customDateRange, setCustomDateRange] = useState({
      startDate: "",
      endDate: "",
      useCustomRange: false,
    })
    const [showDateRangePicker, setShowDateRangePicker] = useState(false)
    // Date range filter states
    const [showDateRangeDialog, setShowDateRangeDialog] = useState(false)
    const [dateRangeStart, setDateRangeStart] = useState("")
    const [dateRangeEnd, setDateRangeEnd] = useState("")
    const [deleteAfterExport, setDeleteAfterExport] = useState(false)
    const [exportLoading, setExportLoading] = useState(false)
    // Image viewer states
    const [showImageViewer, setShowImageViewer] = useState(false)
    const [currentImages, setCurrentImages] = useState<string[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    // Employee states - now using UserProfile type for consistency
    const [employees, setEmployees] = useState<UserProfile[]>([])
    // Add state for login-enabled employees
    const [loginEmployees, setLoginEmployees] = useState<UserProfile[]>([])
    const [newEmployee, setNewEmployee] = useState({
      name: "",
      position: "",
      phone: "",
      startDate: "",
      profileImage: "",
    })
    const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null)
    const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
    const [employeeLoading, setEmployeeLoading] = useState(false)
    // Driver registration states
    const [newDriver, setNewDriver] = useState<DriverRegistration>({
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "driver",
      createdAt: "",
    })
    const [registrationLoading, setRegistrationLoading] = useState(false)
    // Add "director" to the selectedRole type
    const [selectedRole, setSelectedRole] = useState<"manager" | "driver" | "employee">("employee")
    // Add this after the existing states, around line 100
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
    // Edit driver states
    const [editingDriver, setEditingDriver] = useState<UserProfile | null>(null)
    const [editDriverData, setEditDriverData] = useState({
      name: "",
      phone: "",
      email: "",
      newPassword: "",
    })
    const [editLoading, setEditLoading] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    // Profile dialog state
    const [showProfileDialog, setShowProfileDialog] = useState(false)
    const [profileData, setProfileData] = useState({
      name: "",
      phone: "",
      email: "",
      profileImage: "",
    })
    const [profileLoading, setLoadingProfile] = useState(false)
    // Profile image and password states
    const [showPassword, setShowConfirmPassword] = useState(false)
    const [showConfirmPassword, setShowPassword] = useState(false)
    const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    // Payment status dialog states
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    // New states for split payment amounts
    const [cashAmountInput, setCashAmountInput] = useState(0)
    const [cardAmountInput, setCardAmountInput] = useState(0)
    const [transferAmountInput, setTransferAmountInput] = useState(0)
    const [paymentLoading, setPaymentLoading] = useState(0)
    // Add a new state variable for `initialAmountToPay`
    const [initialAmountToPay, setInitialAmountToPay] = useState(0)
    // Edit record dialog states
    const [showEditRecordDialog, setShowEditRecordDialog] = useState(false)
    const [editingRecord, setEditingRecord] = useState<any>(null)
    const [editRecordData, setEditRecordData] = useState({
      carNumber: "",
      mechanicName: "",
      carBrand: "",
      entryTime: "",
      exitTime: "",
      parkingDuration: "",
      notes: "",
    })
    const [editRecordLoading, setEditRecordLoading] = useState(false)
    // State for filter collapsible
    const [isFilterOpen, setIsFilterOpen] = useState(true)

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user)
        if (user) {
          await loadUserProfile(user.uid)
        } else {
          setLoading(false)
        }
      })
      return unsubscribe
    }, [])

    const loadUserProfile = async (userId: string) => {
      const profileRef = ref(database, `users/${userId}`)
      onValue(profileRef, (snapshot) => {
        const data = snapshot.val()
        if (data && (data.role === "manager" || data.role === "director")) {
          setUserProfile(data)
          setProfileData({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            profileImage: data.profileImage || "",
          })
          setLoading(false)
        } else {
          // Хэрэв manager эсвэл director биш бол буцаах
          setUserProfile(null)
          setLoading(false)
        }
      })
      // Load report records after profile is loaded
      setTimeout(() => {
        loadReportRecords()
      }, 500)
      // Add this line after loadReportRecords() call:
      loadEmployees()
      loadManagers()
      loadDirectors() // Add this line to load directors
      loadDrivers()
      loadDashboardData()
      loadLoginEmployees() // Add this line
      // In the loadUserProfile function, after the existing load calls around line 200, add:
      loadAvailableEmployees()
    }

    // Load directors from database
    const loadDirectors = () => {
      const usersRef = ref(database, "users")
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const directorsList: UserProfile[] = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((user) => user.role === "director")
            .sort((a, b) => a.name.localeCompare(b.name))
          setDirectors(directorsList)
        } else {
          setDirectors([])
        }
      })
    }

    // Load drivers from database
    const loadDrivers = () => {
      const usersRef = ref(database, "users")
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const driversList: UserProfile[] = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((user) => user.role === "driver")
            .sort((a, b) => a.name.localeCompare(b.name))
          setDrivers(driversList)
        } else {
          setDrivers([])
        }
      })
    }

    // Enhanced dashboard data loading with better analytics
    const loadDashboardData = (startDate?: string, endDate?: string) => {
      setDashboardLoading(true)
      const recordsRef = ref(database, "parking_records")
      onValue(recordsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          let records = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
          // Filter by custom date range if provided
          if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999) // Include the entire end date
            records = records.filter((record) => {
              const recordDate = new Date(record.timestamp)
              return recordDate >= start && recordDate <= end
            })
          }
          // Calculate enhanced statistics
          const completedRecords = records.filter(
            (record) => record.type === "completed" || record.type === "exit" || record.exitTime,
          )
          const activeRecords = records.filter((record) => record.type === "entry" && !record.exitTime)
          // Today's statistics
          const today = new Date()
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          const todayRecords = completedRecords.filter((record) => {
            const recordDate = new Date(record.timestamp)
            return recordDate >= todayStart && recordDate < todayEnd
          })
          const totalRevenue = completedRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
          const todayRevenue = todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
          // Calculate average session time (in hours)
          const avgSessionTime =
            completedRecords.length > 0
              ? completedRecords.reduce((sum, record) => {
                  if (record.parkingDuration) {
                    // Assuming parkingDuration is in hours format like "2 цаг"
                    const duration = Number.parseFloat(record.parkingDuration.toString().replace(/[^\d.]/g, "")) || 0
                    return sum + duration
                  }
                  return sum
                }, 0) / completedRecords.length
              : 0
          const avgRevenue = completedRecords.length > 0 ? totalRevenue / completedRecords.length : 0
          setDashboardStats({
            totalCustomers: completedRecords.length,
            totalRevenue: totalRevenue,
            activeRecords: activeRecords.length,
            todayCustomers: todayRecords.length,
            todayRevenue: todayRevenue,
            averageSessionTime: avgSessionTime,
            averageRevenue: avgRevenue,
          })
          // Generate monthly statistics
          const monthlyStatsData = []
          const now = new Date()
          if (startDate && endDate) {
            // Custom date range logic
            const start = new Date(startDate)
            const end = new Date(endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays <= 31) {
              // Show daily data for ranges 31 days or less
              for (let i = 0; i <= diffDays; i++) {
                const currentDate = new Date(start)
                currentDate.setDate(start.getDate() + i)
                const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
                const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
                const dayRecords = completedRecords.filter((record) => {
                  const recordDate = new Date(record.timestamp)
                  return recordDate >= dayStart && recordDate < dayEnd
                })
                const dayRevenue = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
                monthlyStatsData.push({
                  period: currentDate.toLocaleDateString("mn-MN", { month: "short", day: "numeric" }),
                  customers: dayRecords.length,
                  revenue: dayRevenue,
                  date: currentDate.toISOString().split("T")[0],
                })
              }
            } else {
              // Show monthly data for longer ranges
              const startMonth = new Date(start.getFullYear(), start.getMonth(), 1)
              const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
              const currentMonth = new Date(startMonth)
              while (currentMonth <= endMonth) {
                const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                const monthRecords = completedRecords.filter((record) => {
                  const recordDate = new Date(record.timestamp)
                  return recordDate >= monthStart && recordDate <= monthEnd
                })
                const monthRevenue = monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
                monthlyStatsData.push({
                  period: currentMonth.toLocaleDateString("mn-MN", { year: "numeric", month: "short" }),
                  customers: monthRecords.length,
                  revenue: monthRevenue,
                  date: currentMonth.toISOString().split("T")[0],
                })
                currentMonth.setMonth(currentMonth.getMonth() + 1)
              }
            }
          } else {
            // Default: Show last 6 months
            for (let i = 5; i >= 0; i--) {
              const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
              const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
              const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
              const monthRecords = completedRecords.filter((record) => {
                const recordDate = new Date(record.timestamp)
                return recordDate >= monthStart && recordDate <= monthEnd
              })
              const monthRevenue = monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
              monthlyStatsData.push({
                period: monthDate.toLocaleDateString("mn-MN", { year: "numeric", month: "short" }),
                customers: monthRecords.length,
                revenue: monthRevenue,
                date: monthDate.toISOString().split("T")[0],
              })
            }
          }
          setMonthlyStats(monthlyStatsData)
          // Generate last 7 days statistics for daily chart
          const dailyStatsData = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            const dayRecords = completedRecords.filter((record) => {
              const recordDate = new Date(record.timestamp)
              return recordDate >= dayStart && recordDate < dayEnd
            })
            const dayRevenue = dayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
            dailyStatsData.push({
              day: date.toLocaleDateString("mn-MN", { weekday: "short" }),
              date: date.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric" }),
              customers: dayRecords.length,
              revenue: dayRevenue,
            })
          }
          setDailyStats(dailyStatsData)
          // Get recent activity (last 10 records from filtered data)
          const sortedRecords = records
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
          setRecentActivity(sortedRecords)
        }
        setDashboardLoading(false)
      })
    }

    // Apply custom date range
    const applyCustomDateRange = () => {
      if (!customDateRange.startDate || !customDateRange.endDate) {
        alert("Эхлэх болон дуусах огноог оруулна уу")
        return
      }
      const startDate = new Date(customDateRange.startDate)
      const endDate = new Date(customDateRange.endDate)
      if (startDate > endDate) {
        alert("Эхлэх огноо дуусах огнооноос өмнө байх ёстой")
        return
      }
      setCustomDateRange({ ...customDateRange, useCustomRange: true })
      loadDashboardData(customDateRange.startDate, customDateRange.endDate)
      setShowDateRangePicker(false)
    }

    // Reset to default (last 6 months)
    const resetToDefaultRange = () => {
      setCustomDateRange({
        startDate: "",
        endDate: "",
        useCustomRange: false,
      })
      loadDashboardData()
      setShowDateRangePicker(false)
    }

    // Load employees from users table where role is 'employee'
    const loadEmployees = () => {
      // Load from employees node
      const employeesRef = ref(database, "employees")
      onValue(employeesRef, (snapshot) => {
        const employeesData = snapshot.val()
        // Also load from users node where role is 'employee'
        const usersRef = ref(database, "users")
        onValue(usersRef, (usersSnapshot) => {
          const usersData = usersSnapshot.val()
          let employeesList: UserProfile[] = []
          // Combine data from both sources
          if (employeesData) {
            Object.keys(employeesData).forEach((key) => {
              employeesList.push({ id: key, ...employeesData[key] })
            })
          }
          if (usersData) {
            Object.keys(usersData).forEach((key) => {
              const user = usersData[key]
              if (user.role === "employee" && !employeesList.find((emp) => emp.id === key)) {
                employeesList.push({ id: key, ...user })
              }
            })
          }
          // Sort by name and remove duplicates
          employeesList = employeesList
            .filter((employee, index, self) => index === self.findIndex((e) => e.name === employee.name))
            .sort((a, b) => a.name.localeCompare(b.name))
          setEmployees(employeesList)
        })
      })
    }

    // Load employees with login access (role = 'employee' from users table)
    const loadLoginEmployees = () => {
      const usersRef = ref(database, "users")
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const loginEmployeesList: UserProfile[] = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((user) => user.role === "employee")
            .sort((a, b) => a.name.localeCompare(b.name))
          setLoginEmployees(loginEmployeesList)
        } else {
          setLoginEmployees([])
        }
      })
    }

    // Load managers from database
    const loadManagers = () => {
      const usersRef = ref(database, "users")
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const managersList: UserProfile[] = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((user) => user.role === "manager")
            .sort((a, b) => a.name.localeCompare(b.name))
          setManagers(managersList)
        } else {
          setManagers([])
        }
      })
    }

    // Add this function after the loadManagers function, around line 300
    const loadAvailableEmployees = () => {
      const employeesRef = ref(database, "employees")
      onValue(employeesRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const employeesList = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => a.name.localeCompare(b.name))
          setAvailableEmployees(employeesList)
        } else {
          setAvailableEmployees([])
        }
      })
    }

    // Handle driver operations
    const handleDeleteDriver = async (driverId: string, driverName: string) => {
      if (!confirm(`${driverName} бүртгэлийг устгахдаа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await remove(ref(database, `users/${driverId}`))
        alert("Бүртгэл амжилттай устгагдлаа")
      } catch (error) {
        alert("Бүртгэл устгахад алдаа гарлаа")
      }
    }

    // In handleEditDriver function:
    const handleEditDriver = (driver: UserProfile) => {
      setEditingDriver(driver)
      setEditDriverData({
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        newPassword: "", // Ensure new password field is always empty on open
      })
      setShowEditDialog(true)
    }

    const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean, driverName: string) => {
      const newStatus = !currentStatus
      const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
      if (!confirm(`${driverName} бүртгэлийг ${statusText}даа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await update(ref(database, `users/${driverId}`), {
          active: newStatus,
          updatedAt: new Date().toISOString(),
        })
        alert(`Бүртгэл амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
      } catch (error) {
        alert("Бүргэлийн төлөв өөрчлөхөд алдаа гарлаа")
      }
    }

    // Handle employee image upload
    const handleEmployeeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert("Зургийн хэмжээ 5MB-аас бага байх ёстой")
          return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64String = event.target?.result as string
          setNewEmployee({ ...newEmployee, profileImage: base64String })
        }
        reader.readAsDataURL(file)
      }
    }

    // Add employee
    const handleAddEmployee = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newEmployee.name.trim()) {
        alert("Ажилчны нэрийг оруулна уу")
        return
      }
      setEmployeeLoading(true)
      try {
        // Create employee data for employees node
        const employeeData = {
          name: newEmployee.name.trim(),
          position: newEmployee.position.trim(),
          phone: newEmployee.phone.trim(),
          startDate: newEmployee.startDate,
          profileImage: newEmployee.profileImage || "",
          createdAt: new Date().toISOString(),
          createdBy: userProfile?.name || "Manager",
          active: true,
          email: `${newEmployee.name.toLowerCase().replace(/\s+/g, "")}@company.com`, // Generate email if not provided
        }
        // Save to employees node
        const employeeRef = await push(ref(database, "employees"), employeeData)
        // Also save to users node with employee role for authentication
        if (employeeRef.key) {
          const userData = {
            ...employeeData,
            role: "employee",
            id: employeeRef.key,
            updatedAt: new Date().toISOString(),
          }
          // Save to users node using the same key
          await set(ref(database, `users/${employeeRef.key}`), userData)
        }
        alert("Ажилчин амжилттай нэмэгдлээ")
        // Reset form
        setNewEmployee({
          name: "",
          position: "",
          phone: "",
          startDate: "",
          profileImage: "",
        })
      } catch (error) {
        console.error("Error adding employee:", error)
        alert("Ажилчин нэмэхэд алдаа гарлаа")
      }
      setEmployeeLoading(false)
    }

    // In handleEditEmployee function:
    const handleEditEmployee = (employee: UserProfile) => {
      setEditingEmployee(employee) // Corrected: set editingEmployee instead of editingDriver
      setEditDriverData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        newPassword: "", // Ensure new password field is always empty on open
      })
      setShowEditDialog(true)
    }

    // In handleSaveEmployeeEdit function:
    const handleSaveEmployeeEdit = async () => {
      console.log("handleSaveEmployeeEdit called")
      if (!editingEmployee || !editDriverData.name.trim() || !editDriverData.email.trim()) {
        alert("Нэр болон и-мэйл хаягийг бөглөнө үү")
        console.error("Validation failed: Missing employee data or required fields.")
        return
      }
      setEditLoading(true)
      try {
        // Merge existing employee data with updated fields
        const updateData: Partial<UserProfile> = {
          ...editingEmployee, // Start with existing data to preserve fields not in the form
          name: editDriverData.name.trim(),
          phone: editDriverData.phone.trim(),
          email: editDriverData.email.trim(),
          updatedAt: new Date().toISOString(),
        }

        // Ensure 'id' is not part of the update payload, as it's the key
        delete updateData.id

        console.log("Updating user with ID:", editingEmployee.id, "with data:", updateData)
        // Update both users and employees nodes for employees
        await update(ref(database, `users/${editingEmployee.id}`), updateData)
        console.log("User node updated successfully.")

        if (editingEmployee.role === "employee") {
          console.log("Updating employee node with ID:", editingEmployee.id, "with data:", updateData)
          await update(ref(database, `employees/${editingEmployee.id}`), updateData)
          console.log("Employee node updated successfully.")
        }

        alert("Ажилчны мэдээлэл амжилттай шинэчлэгдлээ")
        setShowEditDialog(false)
        setEditingEmployee(null)
      } catch (error) {
        console.error("Error updating user/employee:", error)
        alert("Мэдээлэл шинэчлэхэд алдаа гарлаа")
      }
      setEditLoading(false)
    }

    // Delete employee
    const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
      if (!confirm(`${employeeName} ажилчныг устгахдаа итгэлтэй байна уу?`)) {
        return
      }
      try {
        // Delete from both users and employees nodes
        await remove(ref(database, `users/${employeeId}`))
        await remove(ref(database, `employees/${employeeId}`)) // Also delete from employees node
        alert("Ажилчин амжилттай устгагдлаа")
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert("Ажилчин устгахад алдаа гарлаа")
      }
    }

    // Toggle employee status
    const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: boolean, employeeName: string) => {
      const newStatus = !currentStatus
      const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
      if (!confirm(`${employeeName} ажилчныг ${statusText}даа итгэлтэй байна уу?`)) {
        return
      }
      try {
        // Update status in both users and employees nodes
        await update(ref(database, `users/${employeeId}`), {
          active: newStatus,
          updatedAt: new Date().toISOString(),
        })
        await update(ref(database, `employees/${employeeId}`), {
          // Also update the employees node
          active: newStatus,
          updatedAt: new Date().toISOString(),
        })
        alert(`Ажилчин амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
      } catch (error) {
        console.error("Error toggling employee status:", error)
        alert("Ажилчны төлөв өөрчлөхөд алдаа гарлаа")
      }
    }

    // Handle manager operations
    const handleDeleteManager = async (managerId: string, managerName: string) => {
      if (!confirm(`${managerName} менежерийг устгахдаа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await remove(ref(database, `users/${managerId}`))
        alert("Менежер амжилттай устгагдлаа")
      } catch (error) {
        alert("Менежер устгахад алдаа гарлаа")
      }
    }

    const handleEditManager = (manager: UserProfile) => {
      setEditingDriver(manager)
      setEditDriverData({
        name: manager.name,
        phone: manager.phone,
        email: manager.email,
        newPassword: "",
      })
      setShowEditDialog(true)
    }

    const handleToggleManagerStatus = async (managerId: string, currentStatus: boolean, managerName: string) => {
      const newStatus = !currentStatus
      const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
      if (!confirm(`${managerName} менежерийг ${statusText}даа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await update(ref(database, `users/${managerId}`), {
          active: newStatus,
          updatedAt: new Date().toISOString(),
        })
        alert(`Менежер амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
      } catch (error) {
        alert("Менежерийн төлөв өөрчлөхөд алдаа гарлаа")
      }
    }

    // Handle director operations
    const handleDeleteDirector = async (directorId: string, directorName: string) => {
      if (!confirm(`${directorName} захиралыг устгахдаа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await remove(ref(database, `users/${directorId}`))
        alert("Захирал амжилттай устгагдлаа")
      } catch (error) {
        alert("Захирал устгахад алдаа гарлаа")
      }
    }

    const handleEditDirector = (director: UserProfile) => {
      setEditingDriver(director)
      setEditDriverData({
        name: director.name,
        phone: director.phone,
        email: director.email,
        newPassword: "",
      })
      setShowEditDialog(true)
    }

    const handleToggleDirectorStatus = async (directorId: string, currentStatus: boolean, directorName: string) => {
      const newStatus = !currentStatus
      const statusText = newStatus ? "идэвхжүүлэх" : "идэвхгүй болгох"
      if (!confirm(`${directorName} захиралыг ${statusText}даа итгэлтэй байна уу?`)) {
        return
      }
      try {
        await update(ref(database, `users/${directorId}`), {
          active: newStatus,
          updatedAt: new Date().toISOString(),
        })
        alert(`Захирал амжилттай ${newStatus ? "идэвхжлээ" : "идэвхгүй боллоо"}`)
      } catch (error) {
        alert("Захиралын төлөв өөрчлөхөд алдаа гарлаа")
      }
    }

    const loadReportRecords = () => {
      setReportLoading(true)
      const recordsRef = ref(database, "parking_records")
      onValue(recordsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const records = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setReportRecords(records)
          setFilteredReportRecords(records)
        } else {
          setReportRecords([])
          setFilteredReportRecords([])
        }
        setReportLoading(false)
      })
    }

    const calculateParkingFee = (entryTime: string, exitTime: string): number => {
      if (!entryTime || !exitTime) {
        return 0
      }
      try {
        // Parse the Mongolian formatted dates
        const parseMongoDate = (dateStr: string) => {
          // Format: "2024.01.15, 14:30" or similar
          const cleanStr = dateStr.replace(/[^\d\s:.,]/g, "")
          const parts = cleanStr.split(/[,\s]+/)
          if (parts.length >= 2) {
            const datePart = parts[0] // "2024.01.15"
            const timePart = parts[1] // "14:30"
            const [year, month, day] = datePart.split(".").map(Number)
            const [hour, minute] = timePart.split(":").map(Number)
            return new Date(year, month - 1, day, hour, minute)
          }
          // Fallback to direct parsing
          return new Date(dateStr)
        }
        const entryDate = parseMongoDate(entryTime)
        const exitDate = parseMongoDate(exitTime)
        if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
          return 0
        }
        const diffInMs = exitDate.getTime() - entryDate.getTime()
        const diffInMinutes = Math.ceil(diffInMs / (1000 * 60)) // Round up to next minute
        return Math.max(0, diffInMinutes * 0) // Assuming a default rate if pricing config is removed
      } catch (error) {
        console.error("Error calculating parking fee:", error)
        return 0
      }
    }

    const calculateParkingFeeForReport = (record: any): number => {
      // If individual payment amounts are stored, sum them up
      if (record.cashAmount !== undefined || record.cardAmount !== undefined || record.transferAmount !== undefined) {
        return (record.cashAmount || 0) + (record.cardAmount || 0) + (record.transferAmount || 0)
      }
      // Fallback to old logic if individual amounts are not present
      if (record.type === "exit" && record.entryTime) {
        return calculateParkingFee(record.entryTime, record.exitTime || "")
      }
      return record.amount || 0
    }

    // Filter records by date range
    const getDateRangeFilteredRecords = () => {
      if (!dateRangeStart || !dateRangeEnd) {
        return filteredReportRecords
      }
      const startDate = new Date(dateRangeStart)
      const endDate = new Date(dateRangeEnd)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date
      return filteredReportRecords.filter((record) => {
        const recordDate = new Date(record.timestamp)
        return recordDate >= startDate && recordDate <= endDate
      })
    }

    // Image viewer functions
    const openImageViewer = (images: string[], startIndex = 0) => {
      setCurrentImages(images)
      setCurrentImageIndex(startIndex)
      setShowImageViewer(true)
    }

    const closeImageViewer = () => {
      setShowImageViewer(false)
      setCurrentImages([])
      setCurrentImageIndex(0)
    }

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
    }

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
    }

    // Handle keyboard navigation for image viewer
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (showImageViewer) {
          switch (event.key) {
            case "Escape":
              closeImageViewer()
              break
            case "ArrowLeft":
              prevImage()
              break
            case "ArrowRight":
              nextImage()
              break
          }
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [showImageViewer, currentImages.length])

    const exportToExcel = () => {
      try {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        // Prepare data for Excel
        const excelData = filteredReportRecords.map((record, index) => ({
          "№": index + 1,
          "Машины дугаар": record.carNumber,
          Засварчин: record.mechanicName || record.driverName || "-",
          "Машины марк": record.carBrand || record.parkingArea || "-",
          "Орсон цаг": record.entryTime || "-",
          "Гарсан цаг": record.exitTime || "-",
          "Зогссон хугацаа": record.parkingDuration ? `${record.parkingDuration} ц` : "-",
          "Төлбөр (₮)": calculateParkingFeeForReport(record),
          "Бэлэн мөнгө (₮)": record.cashAmount || 0, // Added cash amount
          "Карт (₮)": record.cardAmount || 0, // Added card amount
          "Харилцах (₮)": record.transferAmount || 0, // Added transfer amount
          "Төлбөрийн төлөв": record.paymentStatus === "paid" ? "Төлсөн" : "Төлөөгүй",
          Зураг: record.images && record.images.length > 0 ? "Байна" : "Байхгүй",
        }))
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData)
        // Set column widths
        const colWidths = [
          { wch: 5 }, // №
          { wch: 15 }, // Машины дугаар
          { wch: 20 }, // Засварчин
          { wch: 15 }, // Машины марк
          { wch: 20 }, // Орсон цаг
          { wch: 20 }, // Гарсан цаг
          { wch: 15 }, // Зогссон хугацаа
          { wch: 12 }, // Төлбөр
          { wch: 15 }, // Бэлэн мөнгө
          { wch: 12 }, // Карт
          { wch: 15 }, // Харилцах
          { wch: 15 }, // Төлбөрийн төлөв
          { wch: 10 }, // Зураг
        ]
        ws["!cols"] = colWidths
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Зогсоолын тайлан")
        // Add summary rows
        const summaryData = [
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Бэлэн мөнгө:",
            "Төлбөр (₮)": totalCashAmount,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Карт:",
            "Төлбөр (₮)": totalCardAmount,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Харилцах:",
            "Төлбөр (₮)": totalTransferAmount,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт дүн:",
            "Төлбөр (₮)": totalCashAmount + totalCardAmount + totalTransferAmount,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
        ]
        XLSX.utils.sheet_add_json(ws, summaryData, { skipHeader: true, origin: -1 })
        // Generate filename with current date
        const currentDate = new Date().toISOString().split("T")[0]
        const filename = `Зогсоолын_тайлан_${currentDate}.xlsx`
        // Create blob and download file (browser-compatible way)
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([wbout], { type: "application/octet-stream" })
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        alert("Excel файл амжилттай татагдлаа!")
      } catch (error) {
        console.error("Excel export error:", error)
        alert("Excel файл татахад алдаа гарлаа")
      }
    }

    // Export with date range and optional deletion
    const handleDateRangeExport = async () => {
      if (!dateRangeStart || !dateRangeEnd) {
        alert("Эхлэх болон дуусах огноог оруулна уу")
        return
      }
      const startDate = new Date(dateRangeStart)
      const endDate = new Date(dateRangeEnd)
      if (startDate > endDate) {
        alert("Эхлэх огноо дуусах огнооноос өмнө байх ёстой")
        return
      }
      setExportLoading(true)
      try {
        const recordsToExport = getDateRangeFilteredRecords()
        if (recordsToExport.length === 0) {
          alert("Тухайн хугацаанд бүртгэл олдсонгүй")
          setExportLoading(false)
          return
        }
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new()
        // Prepare data for Excel
        const excelData = recordsToExport.map((record, index) => ({
          "№": index + 1,
          "Машины дугаар": record.carNumber,
          Засварчин: record.mechanicName || record.driverName || "-",
          "Машины марк": record.carBrand || record.parkingArea || "-",
          "Орсон цаг": record.entryTime || "-",
          "Гарсан цаг": record.exitTime || "-",
          "Зогссон хугацаа": record.parkingDuration ? `${record.parkingDuration} ц` : "-",
          "Төлбөр (₮)": calculateParkingFeeForReport(record),
          "Бэлэн мөнгө (₮)": record.cashAmount || 0, // Added cash amount
          "Карт (₮)": record.cardAmount || 0, // Added card amount
          "Харилцах (₮)": record.transferAmount || 0, // Added transfer amount
          "Төлбөрийн төлөв": record.paymentStatus === "paid" ? "Төлсөн" : "Төлөөгүй",
          Зураг: record.images && record.images.length > 0 ? "Байна" : "Байхгүй",
        }))
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData)
        // Set column widths
        const colWidths = [
          { wch: 5 }, // №
          { wch: 15 }, // Машины дугаар
          { wch: 20 }, // Засварчин
          { wch: 15 }, // Машины марк
          { wch: 20 }, // Орсон цаг
          { wch: 20 }, // Гарсан цаг
          { wch: 15 }, // Зогссон хугацаа
          { wch: 12 }, // Төлбөр
          { wch: 15 }, // Бэлэн мөнгө
          { wch: 12 }, // Карт
          { wch: 15 }, // Харилцах
          { wch: 15 }, // Төлбөрийн төлөв
          { wch: 10 }, // Зураг
        ]
        ws["!cols"] = colWidths
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Зогсоолын тайлан")
        // Calculate sums for the exported records
        let exportCashSum = 0
        let exportCardSum = 0
        let exportTransferSum = 0
        recordsToExport.forEach((record) => {
          if (record.paymentStatus === "paid") {
            exportCashSum += record.cashAmount || 0
            exportCardSum += record.cardAmount || 0
            exportTransferSum += record.transferAmount || 0
          }
        })

        // Add summary rows
        const summaryData = [
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Бэлэн мөнгө:",
            "Төлбөр (₮)": exportCashSum,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Карт:",
            "Төлбөр (₮)": exportCardSum,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт Харилцах:",
            "Төлбөр (₮)": exportTransferSum,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
          {
            "№": "",
            "Машины дугаар": "",
            Засварчин: "",
            "Машины марк": "",
            "Орсон цаг": "",
            "Гарсан цаг": "",
            "Зогссон хугацаа": "Нийт дүн:",
            "Төлбөр (₮)": exportCashSum + exportCardSum + exportTransferSum,
            "Бэлэн мөнгө (₮)": "",
            "Карт (₮)": "",
            "Харилцах (₮)": "",
            "Төлбөрийн төлөв": "",
            Зураг: "",
          },
        ]
        XLSX.utils.sheet_add_json(ws, summaryData, { skipHeader: true, origin: -1 })
        // Generate filename with date range
        const startDateStr = dateRangeStart.replace(/-/g, ".")
        const endDateStr = dateRangeEnd.replace(/-/g, ".")
        const filename = `Зогсоолын_тайлан_${startDateStr}_${endDateStr}.xlsx`
        // Create blob and download file (browser-compatible way)
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([wbout], { type: "application/octet-stream" })
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        // Delete records if option is selected
        if (deleteAfterExport) {
          const deletePromises = recordsToExport.map((record) => remove(ref(database, `parking_records/${record.id}`)))
          await Promise.all(deletePromises)
          alert(`Excel файл амжилттай татагдлаа! ${recordsToExport.length} бүртгэл өгөгдлийн сангаас устгагдлаа.`)
        } else {
          alert(`Excel файл амжилттай татагдлаа! ${recordsToExport.length} бүртгэл татагдлаа.`)
        }
        // Reset form
        setDateRangeStart("")
        setDateRangeEnd("")
        setDeleteAfterExport(false)
        setShowDateRangeDialog(false)
      } catch (error) {
        console.error("Date range export error:", error)
        alert("Excel файл татахад алдаа гарлаа")
      }
      setExportLoading(false)
    }

    // Get unique mechanic names for filter
    const getAvailableMechanicNames = () => {
      const names = reportRecords.map((record) => record.mechanicName || record.driverName)
      return [...new Set(names)].filter((name) => name).sort()
    }

    // Get unique years for report filter
    const getReportAvailableYears = () => {
      const years = reportRecords.map((record) => new Date(record.timestamp).getFullYear())
      return [...new Set(years)].sort((a, b) => b - a)
    }

    // Filter report records
    useEffect(() => {
      let filtered = [...reportRecords]
      if (reportFilterYear) {
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.timestamp)
          return recordDate.getFullYear().toString() === reportFilterYear
        })
      }
      if (reportFilterMonth) {
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.timestamp)
          return (recordDate.getMonth() + 1).toString().padStart(2, "0") === reportFilterMonth
        })
      }
      if (reportFilterCarNumber) {
        filtered = filtered.filter((record) =>
          record.carNumber.toLowerCase().includes(reportFilterCarNumber.toLowerCase()),
        )
      }
      if (reportFilterMechanic) {
        filtered = filtered.filter((record) => {
          const mechanicName = record.mechanicName || record.driverName || ""
          return mechanicName.toLowerCase().includes(reportFilterMechanic.toLowerCase())
        })
      }
      // Add payment status filter
      if (reportFilterPaymentStatus) {
        filtered = filtered.filter((record) => {
          if (reportFilterPaymentStatus === "paid") {
            return record.paymentStatus === "paid"
          } else if (reportFilterPaymentStatus === "unpaid") {
            return record.paymentStatus !== "paid"
          }
          return true
        })
      }
      setFilteredReportRecords(filtered)

      // Calculate total amounts for each payment method
      let cashSum = 0
      let cardSum = 0
      let transferSum = 0
      filtered.forEach((record) => {
        if (record.paymentStatus === "paid") {
          cashSum += record.cashAmount || 0
          cardSum += record.cardAmount || 0
          transferSum += record.transferAmount || 0
        }
      })
      setTotalCashAmount(cashSum)
      setTotalCardAmount(cardSum)
      setTotalTransferAmount(transferSum)
    }, [
      reportRecords,
      reportFilterYear,
      reportFilterMonth,
      reportFilterCarNumber,
      reportFilterMechanic,
      reportFilterPaymentStatus,
    ])

    const handleRegisterDriver = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newDriver.email || !newDriver.password || !newDriver.name) {
        alert("Бүх талбарыг бөглөнө үү")
        return
      }
      if (newDriver.password.length < 6) {
        alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой")
        return
      }
      setRegistrationLoading(true)
      try {
        // Firebase Auth дээр хэрэглэгч үүсгэх
        const userCredential = await createUserWithEmailAndPassword(auth, newDriver.email, newDriver.password)
        const newUserId = userCredential.user.uid
        // Database дээр хэрэглэгчийн мэдээлэл хадгалах
        const userData: UserProfile = {
          name: newDriver.name.trim(),
          phone: newDriver.phone.trim(),
          email: newDriver.email,
          role: selectedRole, // Use selectedRole directly - it can be "manager", "driver", "employee", or "director"
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await set(ref(database, `users/${newUserId}`), userData)
        // Update the alert message to include "director"
        alert(
          `${selectedRole === "manager" ? "Менежер" : selectedRole === "driver" ? "Бүртгэл" : selectedRole === "employee" ? "Засварчин" : "Ажилчин"} амжилттай бүртгэгдлээ`,
        )
        // Form цэвэрлэх
        setNewDriver({
          email: "",
          password: "",
          name: "",
          phone: "",
          role: "driver",
          createdAt: "",
        })
      } catch (error: any) {
        console.error("Driver registration error:", error)
        if (error.code === "auth/email-already-in-use") {
          alert("Энэ и-мэйл хаяг аль хэдийн ашиглагдаж байна")
        } else if (error.code === "auth/invalid-email") {
          alert("И-мэйл хаяг буруу байна")
        } else {
          alert("Бүртгэхэд алдаа гарлаа")
        }
      }
      setRegistrationLoading(false)
    }

    // Add this function after the handleRegisterDriver function, around line 1000
    const handleEmployeeSelection = (employeeId: string) => {
      const selectedEmployee = availableEmployees.find((emp) => emp.id === employeeId)
      if (selectedEmployee) {
        setNewDriver({
          ...newDriver,
          name: selectedEmployee.name,
          phone: selectedEmployee.phone || "",
        })
      }
    }

    // In handleSaveDriverEdit function:
    const handleSaveDriverEdit = async () => {
      if (!editingDriver || !editDriverData.name.trim() || !editDriverData.email.trim()) {
        alert("Нэр болон и-мэйл хаягийг бөглөнө үү")
        return
      }
      setEditLoading(true)
      try {
        // Update user data in database
        const updateData: any = {
          name: editDriverData.name.trim(),
          phone: editDriverData.phone.trim(),
          email: editDriverData.email.trim(),
          updatedAt: new Date().toISOString(),
        }
        await update(ref(database, `users/${editingDriver.id}`), updateData)
        // Note: Password update requires re-authentication in a production environment.
        // This simplified example only updates profile data (name, phone, email).
        const userType =
          editingDriver.role === "manager"
            ? "Менежерийн"
            : editingDriver.role === "driver"
              ? "Бүртгэлийн"
              : editingDriver.role === "director"
                ? "Захиралын"
                : "Ажилчны"
        alert(`${userType} мэдээлэл амжилттай шинэчлэгдлээ`)
        setShowEditDialog(false)
        setEditingDriver(null)
      } catch (error) {
        console.error("Error updating user:", error)
        const userType =
          editingDriver?.role === "manager"
            ? "менежерийн"
            : editingDriver?.role === "driver"
              ? "бүртгэлийн"
              : editingDriver?.role === "director"
                ? "захиралын"
                : "ажилчны"
        alert(`${userType} мэдээлэл шинэчлэхэд алдаа гарлаа`)
      }
      setEditLoading(false)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile") => {
      const file = e.target.files?.[0]
      if (file) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert("Зургийн хэмжээ 5MB-аас бага байх ёстой")
          return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64String = event.target?.result as string
          if (type === "profile") {
            setProfileData({ ...profileData, profileImage: base64String })
          }
        }
        reader.readAsDataURL(file)
      }
    }

    const handleSaveProfile = async () => {
      if (!profileData.name.trim()) {
        alert("Нэрээ оруулна уу")
        return
      }
      if (!profileData.email.trim()) {
        alert("И-мэйл хаягаа оруулна уу")
        return
      }
      // Validate password if provided
      if (passwordData.newPassword) {
        if (passwordData.newPassword.length < 6) {
          alert("Нууц үг хамгийн багадаа 6 тэмдэг байх ёстой")
          return
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert("Нууц үг таарахгүй байна")
          return
        }
      }
      setLoadingProfile(true)
      try {
        if (user) {
          const updateData = {
            name: profileData.name.trim(),
            phone: profileData.phone.trim(),
            email: profileData.email.trim(),
            profileImage: profileData.profileImage,
            updatedAt: new Date().toISOString(),
          }
          await update(ref(database, `users/${user.uid}`), updateData)
          alert("Профайл амжилттай шинэчлэгдлээ")
          setShowProfileDialog(false)
          // Clear password fields
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        }
      } catch (error) {
        console.error("Error updating profile:", error)
        alert("Профайл шинэчлэхэд алдаа гарлаа")
      }
      setLoadingProfile(false)
    }

    const handlePaymentStatusUpdate = (record: any) => {
      setSelectedRecord(record)
      // Initialize payment amounts from existing data
      setCashAmountInput(record.cashAmount || 0)
      setCardAmountInput(record.cardAmount || 0)
      setTransferAmountInput(record.transferAmount || 0)
      setInitialAmountToPay(calculateParkingFeeForReport(record))
      setShowPaymentDialog(true)
    }

    const handleSavePaymentStatus = async () => {
      if (!selectedRecord) return
      // Validate that at least one payment amount is greater than 0
      const totalAmount = cashAmountInput + cardAmountInput + transferAmountInput
      if (totalAmount <= 0) {
        alert("Хамгийн багадаа нэг төлбөрийн хэлбэрт 0-ээс их дүн оруулна уу")
        return
      }
      setPaymentLoading(true)
      try {
        const updateData = {
          paymentStatus: "paid",
          cashAmount: cashAmountInput,
          cardAmount: cardAmountInput,
          transferAmount: transferAmountInput,
          amount: totalAmount, // Keep total amount for backward compatibility
          paymentMethod:
            cashAmountInput > 0 && cardAmountInput === 0 && transferAmountInput === 0
              ? "cash"
              : cardAmountInput > 0 && cashAmountInput === 0 && transferAmountInput === 0
                ? "card"
                : transferAmountInput > 0 && cashAmountInput === 0 && cardAmountInput === 0
                  ? "mixed"
                  : "mixed", // Mixed payment
          updatedAt: new Date().toISOString(),
        }
        await update(ref(database, `parking_records/${selectedRecord.id}`), updateData)
        alert("Төлбөрийн мэдээлэл амжилттай шинэчлэгдлээ")
        setShowPaymentDialog(false)
        setSelectedRecord(null)
        // Reset payment amounts
        setCashAmountInput(0)
        setCardAmountInput(0)
        setTransferAmountInput(0)
      } catch (error) {
        console.error("Error updating payment status:", error)
        alert("Төлбөрийн мэдээлэл шинэчлэхэд алдаа гарлаа")
      }
      setPaymentLoading(false)
    }

    // Edit record functions
    const handleEditRecord = (record: any) => {
      setEditingRecord(record)
      setEditRecordData({
        carNumber: record.carNumber || "",
        mechanicName: record.mechanicName || record.driverName || "",
        carBrand: record.carBrand || record.parkingArea || "",
        entryTime: record.entryTime || "",
        exitTime: record.exitTime || "",
        parkingDuration: record.parkingDuration || "",
        notes: "",
      })
      setShowEditRecordDialog(true)
    }

    const handleSaveRecordEdit = async () => {
      if (!editingRecord || !editRecordData.carNumber.trim()) {
        alert("Машины дугаарыг оруулна уу")
        return
      }
      setEditRecordLoading(true)
      try {
        const updateData = {
          carNumber: editRecordData.carNumber.trim(),
          mechanicName: editRecordData.mechanicName.trim(),
          driverName: editRecordData.mechanicName.trim(), // Keep both for compatibility
          carBrand: editRecordData.carBrand.trim(),
          parkingArea: editRecordData.carBrand.trim(), // Keep both for compatibility
          entryTime: editRecordData.entryTime,
          exitTime: editRecordData.exitTime,
          parkingDuration: editRecordData.parkingDuration,
          notes: editRecordData.notes.trim(),
          updatedAt: new Date().toISOString(),
        }
        await update(ref(database, `parking_records/${editingRecord.id}`), updateData)
        alert("Бүртгэл амжилттай шинэчлэгдлээ")
        setShowEditRecordDialog(false)
        setEditingRecord(null)
      } catch (error) {
        console.error("Error updating record:", error)
        alert("Бүртгэл шинэчлэхэд алдаа гарлаа")
      }
      setEditRecordLoading(false)
    }

    const handleLogout = async () => {
      if (confirm("Системээс гарахдаа итгэлтэй байна уу?")) {
        try {
          await signOut(auth)
          alert("Амжилттай гарлаа")
          router.push("/login") // Redirect to login page
        } catch (error) {
          alert("Гарахад алдаа гарлаа")
        }
      }
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Ачааллаж байна...</p>
          </div>
        </div>
      )
    }

    if (!user || !userProfile || (userProfile.role !== "manager" && userProfile.role !== "director")) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <Card className="w-full max-w-md bg-gray-900 text-white border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Хандах эрх хүрэлцэхгүй</CardTitle>
              <CardDescription className="text-center text-gray-400">
                Та менежер эсвэл захиралын эрхтэй байх ёстой
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Буцах
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-black shadow-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-white">
                  {userProfile.role === "director" ? "Захиралын" : "Менежерийн"} самбар
                </h1>
                <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                  {userProfile.role === "director" ? "Захирал" : "Менежер"}
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-gray-800">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile.profileImage || "/placeholder.svg"} />
                        <AvatarFallback>
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block">{userProfile.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 text-white border-gray-700">
                    <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="hover:bg-gray-800">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Профайл засах
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:bg-gray-800">
                      <LogOut className="w-4 h-4 mr-2" />
                      Гарах
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-700">
              <TabsTrigger
                value="dashboard"
                className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Хяналтын самбар</span>
              </TabsTrigger>
              <TabsTrigger
                value="employees"
                className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <Users className="w-4 h-4" />
                <span>Ажилчид</span>
              </TabsTrigger>
              <TabsTrigger
                value="registration"
                className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <UserPlus className="w-4 h-4" />
                <span>Бүртгэл</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                <Car className="w-4 h-4" />
                <span>Тайлан</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Хяналтын самбар</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDateRangePicker(true)}
                    className="flex items-center space-x-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Огнооны хүрээ</span>
                  </Button>
                  {customDateRange.useCustomRange && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaultRange}
                      className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                    >
                      Анхдагш
                    </Button>
                  )}
                </div>
              </div>

              {/* Date Range Picker Dialog */}
              <Dialog open={showDateRangePicker} onOpenChange={setShowDateRangePicker}>
                <DialogContent className="bg-gray-900 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Огнооны хүрээ сонгох</DialogTitle>
                    <DialogDescription className="text-gray-400">Тайлангийн хугацааг сонгоно уу</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="startDate" className="text-gray-300">
                        Эхлэх огноо
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-gray-300">
                        Дуусах огноо
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                        className="bg-gray-800 text-white border-gray-700"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDateRangePicker(false)}
                      className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                    >
                      Цуцлах
                    </Button>
                    <Button onClick={applyCustomDateRange} className="bg-blue-600 text-white hover:bg-blue-700">
                      Хайх
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Нийт үйлчлүүлэгч</CardTitle>
                        <Users className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalCustomers.toLocaleString()}</div>
                        <p className="text-xs text-gray-400">Бүх цагийн</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Нийт орлого</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₮{dashboardStats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-gray-400">Бүх цагийн</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Идэвхтэй зогсоол</CardTitle>
                        <Car className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.activeRecords}</div>
                        <p className="text-xs text-gray-400">Одоогийн байдлаар</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Өнөөдрийн орлого</CardTitle>
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₮{dashboardStats.todayRevenue.toLocaleString()}</div>
                        <p className="text-xs text-gray-400">{dashboardStats.todayCustomers} үйлчлүүлэгч</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly/Period Stats Chart */}
                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">
                          {customDateRange.useCustomRange ? "Хугацааны статистик" : "Сарын статистик"}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {customDateRange.useCustomRange
                            ? `${customDateRange.startDate} - ${customDateRange.endDate}`
                            : "Сүүлийн 6 сар"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {monthlyStats.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-300">{stat.period}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">₮{stat.revenue.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{stat.customers} үйлчлүүлэгч</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Daily Stats Chart */}
                    <Card className="bg-gray-900 text-white border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">7 хоногийн статистик</CardTitle>
                        <CardDescription className="text-gray-400">Сүүлийн долоо хоногийн үйл ажиллагаа</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dailyStats.map((stat, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-300">
                                  {stat.day} ({stat.date})
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">₮{stat.revenue.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{stat.customers} үйлчлүүлэгч</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Сүүлийн үйл ажиллагаа</CardTitle>
                      <CardDescription className="text-gray-400">Сүүлийн 10 бүртгэл</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Бүртгэл олдсонгүй</p>
                        ) : (
                          recentActivity.map((record, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-gray-800 pb-2">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    record.type === "entry"
                                      ? "bg-green-500"
                                      : record.type === "exit"
                                        ? "bg-red-500"
                                        : "bg-blue-500"
                                  }`}
                                ></div>
                                <div>
                                  <div className="font-medium">{record.carNumber}</div>
                                  <div className="text-sm text-gray-400">
                                    {record.mechanicName || record.driverName || "Тодорхойгүй"}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  {record.type === "entry" ? "Орсон" : record.type === "exit" ? "Гарсан" : "Дууссан"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(record.timestamp).toLocaleString("mn-MN")}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Ажилчдын удирдлага</h2>
                <Button
                  onClick={() => setShowEmployeeDialog(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ажилчин нэмэх</span>
                </Button>
              </div>

              {/* Employee Management Tabs */}
              <Tabs defaultValue="employees" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-700">
                  <TabsTrigger
                    value="employees"
                    className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Ажилчид ({employees.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="managers"
                    className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Менежерүүд ({managers.length})
                  </TabsTrigger>
                  {/* Removed Directors TabTrigger */}
                  <TabsTrigger
                    value="drivers"
                    className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Бүртгэгч ({drivers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Employees List */}
                <TabsContent value="employees">
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Ажилчдын жагсаалт</CardTitle>
                      <CardDescription className="text-gray-400">Бүх ажилчдын мэдээлэл</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {employees.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Ажилчин олдсонгүй</p>
                      ) : (
                        <div className="space-y-4">
                          {employees.map((employee) => (
                            <div
                              key={employee.id}
                              className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={employee.profileImage || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    <UserIcon className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-white">{employee.name}</h3>
                                  <p className="text-sm text-gray-400">{employee.position || "Ажилчин"}</p>
                                  <p className="text-sm text-gray-500">{employee.phone}</p>
                                  <p className="text-sm text-gray-500">{employee.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={employee.active !== false ? "default" : "secondary"}
                                  className={
                                    employee.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                  }
                                >
                                  {employee.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                    <DropdownMenuItem
                                      onClick={() => handleEditEmployee(employee)}
                                      className="hover:bg-gray-800"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Засах
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleToggleEmployeeStatus(employee.id!, employee.active !== false, employee.name)
                                      }
                                      className="hover:bg-gray-800"
                                    >
                                      {employee.active !== false ? (
                                        <>
                                          <PowerOff className="w-4 h-4 mr-2" />
                                          Идэвхгүй болгох
                                        </>
                                      ) : (
                                        <>
                                          <Power className="w-4 h-4 mr-2" />
                                          Идэвхжүүлэх
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteEmployee(employee.id!, employee.name)}
                                      className="text-red-500 hover:bg-gray-800"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Устгах
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Managers List */}
                <TabsContent value="managers">
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Менежерүүдийн жагсаалт</CardTitle>
                      <CardDescription className="text-gray-400">Бүх менежерүүдийн мэдээлэл</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {managers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Менежер олдсонгүй</p>
                      ) : (
                        <div className="space-y-4">
                          {managers.map((manager) => (
                            <div
                              key={manager.id}
                              className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={manager.profileImage || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    <Shield className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-white">{manager.name}</h3>
                                  <p className="text-sm text-gray-400">Менежер</p>
                                  <p className="text-sm text-gray-500">{manager.phone}</p>
                                  <p className="text-sm text-gray-500">{manager.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={manager.active !== false ? "default" : "secondary"}
                                  className={
                                    manager.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                  }
                                >
                                  {manager.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                    <DropdownMenuItem
                                      onClick={() => handleEditManager(manager)}
                                      className="hover:bg-gray-800"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Засах
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleToggleManagerStatus(manager.id!, manager.active !== false, manager.name)
                                      }
                                      className="hover:bg-gray-800"
                                    >
                                      {manager.active !== false ? (
                                        <>
                                          <PowerOff className="w-4 h-4 mr-2" />
                                          Идэвхгүй болгох
                                        </>
                                      ) : (
                                        <>
                                          <Power className="w-4 h-4 mr-2" />
                                          Идэвхжүүлэх
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteManager(manager.id!, manager.name)}
                                      className="text-red-500 hover:bg-gray-800"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Устгах
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Drivers List */}
                <TabsContent value="drivers">
                  <Card className="bg-gray-900 text-white border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Бүртгэгчийн жагсаалт</CardTitle>
                      <CardDescription className="text-gray-400">Бүх Бүртгэгчийн мэдээлэл</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {drivers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Бүртгэгч олдсонгүй</p>
                      ) : (
                        <div className="space-y-4">
                          {drivers.map((driver) => (
                            <div
                              key={driver.id}
                              className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={driver.profileImage || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    <Car className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-white">{driver.name}</h3>
                                  <p className="text-sm text-gray-400">Бүртгэгч</p>
                                  <p className="text-sm text-gray-500">{driver.phone}</p>
                                  <p className="text-sm text-gray-500">{driver.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={driver.active !== false ? "default" : "secondary"}
                                  className={
                                    driver.active !== false ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300"
                                  }
                                >
                                  {driver.active !== false ? "Идэвхтэй" : "Идэвхгүй"}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-900 text-white border-gray-700">
                                    <DropdownMenuItem
                                      onClick={() => handleEditDriver(driver)}
                                      className="hover:bg-gray-800"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Засах
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleToggleDriverStatus(driver.id!, driver.active !== false, driver.name)
                                      }
                                      className="hover:bg-gray-800"
                                    >
                                      {driver.active !== false ? (
                                        <>
                                          <PowerOff className="w-4 h-4 mr-2" />
                                          Идэвхгүй болгох
                                        </>
                                      ) : (
                                        <>
                                          <Power className="w-4 h-4 mr-2" />
                                          Идэвхжүүлэх
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteDriver(driver.id!, driver.name)}
                                      className="text-red-500 hover:bg-gray-800"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Устгах
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Registration Tab */}
            <TabsContent value="registration" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Хэрэглэгч бүртгэх</h2>
              </div>

              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Шинэ хэрэглэгч бүртгэх</CardTitle>
                  <CardDescription className="text-gray-400">Системд шинэ хэрэглэгч нэмэх</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterDriver} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role" className="text-gray-300">
                          Албан тушаал
                        </Label>
                        <select
                          id="role"
                          value={selectedRole}
                          onChange={(e) => {
                            setSelectedRole(e.target.value as "manager" | "driver" | "employee")
                            // Reset name and phone when role changes
                            setNewDriver((prev) => ({ ...prev, name: "", phone: "" }))
                          }}
                          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                        >
                          <option value="employee">Засварчин</option>
                          <option value="driver">Бүртгэгч</option>
                          <option value="manager">Менежер</option>
                        </select>
                        <div className="mt-2 p-3 bg-gray-800 rounded-md">
                          <p className="text-sm text-gray-400">
                            {selectedRole === "employee" && "Засварчин - Зогсоолын үйл ажиллагаанд оролцох эрхтэй"}
                            {selectedRole === "driver" && "Бүртгэгч - Машин бүртгэх, гаргах эрхтэй"}
                            {selectedRole === "manager" && "Менежер - Бүх системийн эрхтэй, тайлан харах боломжтой"}
                          </p>
                        </div>
                      </div>

                      {selectedRole === "employee" && (
                        <div>
                          <Label htmlFor="selectEmployee" className="text-gray-300">
                            Засварчин сонгох
                          </Label>
                          <select
                            id="selectEmployee"
                            value={
                              newDriver.name
                                ? availableEmployees.find((emp) => emp.name === newDriver.name)?.id || ""
                                : ""
                            }
                            onChange={(e) => handleEmployeeSelection(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          >
                            <option value="">Сонгоно уу</option>
                            {availableEmployees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Эндээс сонгосноор нэр болон утасны дугаар автоматаар бөглөгдөнө.
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="name" className="text-gray-300">
                          Нэр
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={newDriver.name}
                          onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                          placeholder="Бүтэн нэрээ оруулна уу"
                          required
                          className="bg-gray-800 text-white border-gray-700"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-gray-300">
                          Утасны дугаар
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newDriver.phone}
                          onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                          placeholder="99112233"
                          className="bg-gray-800 text-white border-gray-700"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-gray-300">
                          И-мэйл хаяг
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newDriver.email}
                          onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                          placeholder="example@email.com"
                          required
                          className="bg-gray-800 text-white border-gray-700"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-gray-300">
                          Нууц үг
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newDriver.password}
                          onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                          placeholder="Хамгийн багадаа 6 тэмдэгт"
                          required
                          minLength={6}
                          className="bg-gray-800 text-white border-gray-700"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registrationLoading}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {registrationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Бүртгэж байна...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {selectedRole === "manager" ? "Менежер" : selectedRole === "driver" ? "Бүртгэгч" : "Ажилчин"}{" "}
                          бүртгэх
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Тайлан</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowDateRangeDialog(true)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Огнооны хүрээгээр татах
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel татах
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="group">
                <Card className="bg-gray-900 text-white border-gray-700">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 cursor-pointer">
                      <CardTitle className="text-white">Шүүлтүүр</CardTitle>
                      <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label htmlFor="filterYear" className="text-gray-300">
                            Жил
                          </Label>
                          <select
                            id="filterYear"
                            value={reportFilterYear}
                            onChange={(e) => setReportFilterYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          >
                            <option value="">Бүх жил</option>
                            {getReportAvailableYears().map((year) => (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="filterMonth" className="text-gray-300">
                            Сар
                          </Label>
                          <select
                            id="filterMonth"
                            value={reportFilterMonth}
                            onChange={(e) => setReportFilterMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          >
                            <option value="">Бүх сар</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                              <option key={month} value={month.toString().padStart(2, "0")}>
                                {month}-р сар
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="filterCarNumber" className="text-gray-300">
                            Машины дугаар
                          </Label>
                          <Input
                            id="filterCarNumber"
                            type="text"
                            value={reportFilterCarNumber}
                            onChange={(e) => setReportFilterCarNumber(e.target.value)}
                            placeholder="Машины дугаар хайх"
                            className="bg-gray-800 text-white border-gray-700"
                          />
                        </div>

                        <div>
                          <Label htmlFor="filterMechanic" className="text-gray-300">
                            Засварчин
                          </Label>
                          <select
                            id="filterMechanic"
                            value={reportFilterMechanic}
                            onChange={(e) => setReportFilterMechanic(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          >
                            <option value="">Бүх засварчин</option>
                            {getAvailableMechanicNames().map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="filterPaymentStatus" className="text-gray-300">
                            Төлбөрийн төлөв
                          </Label>
                          <select
                            id="filterPaymentStatus"
                            value={reportFilterPaymentStatus}
                            onChange={(e) => setReportFilterPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          >
                            <option value="">Бүх төлөв</option>
                            <option value="paid">Төлсөн</option>
                            <option value="unpaid">Төлөөгүй</option>
                          </select>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-950 p-3 rounded-lg">
                          <h3 className="font-semibold text-green-300 text-base">Бэлэн мөнгө</h3>
                          <p className="text-xl font-bold text-green-200">₮{totalCashAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-950 p-3 rounded-lg">
                          <h3 className="font-semibold text-blue-300 text-base">Карт</h3>
                          <p className="text-xl font-bold text-blue-200">₮{totalCardAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-950 p-3 rounded-lg">
                          <h3 className="font-semibold text-purple-300 text-base">Харилцах</h3>
                          <p className="text-xl font-bold text-purple-200">₮{totalTransferAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <h3 className="font-semibold text-gray-300 text-base">Нийт</h3>
                          <p className="text-xl font-bold text-gray-200">
                            ₮{(totalCashAmount + totalCardAmount + totalTransferAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Records Table */}
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Зогсоолын бүртгэл ({filteredReportRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredReportRecords.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Бүртгэл олдсонгүй</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-700">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">№</th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Машины дугаар
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Засварчин
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Машины марк
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Орсон цаг
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Гарсан цаг
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Зогссон хугацаа
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">Төлбөр</th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">
                              Төлбөрийн төлөв
                            </th>
                            <th className="border border-gray-700 px-1 py-0.5 text-left text-gray-300 text-xs">Зураг</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReportRecords.map((record, index) => (
                            <tr key={record.id} className="hover:bg-gray-800">
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">{index + 1}</td>
                              <td className="border border-gray-700 px-1 py-0.5 font-normal text-xs text-gray-200">
                                {record.carNumber}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                {record.mechanicName || record.driverName || "-"}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                {record.carBrand || record.parkingArea || "-"}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                {record.entryTime || "-"}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                {record.exitTime || "-"}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                {record.parkingDuration || "-"}
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5 text-gray-200 text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-xs text-white">
                                    ₮{calculateParkingFeeForReport(record).toLocaleString()}
                                  </div>
                                  {record.paymentStatus === "paid" && (
                                    <div className="text-xs text-gray-400">
                                      {record.cashAmount > 0 && <div>Бэлэн: ₮{record.cashAmount.toLocaleString()}</div>}
                                      {record.cardAmount > 0 && <div>Карт: ₮{record.cardAmount.toLocaleString()}</div>}
                                      {record.transferAmount > 0 && (
                                        <div>Харилцах: ₮{record.transferAmount.toLocaleString()}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5">
                                <div className="flex items-center space-x-1">
                                  <Badge
                                    variant={record.paymentStatus === "paid" ? "default" : "secondary"}
                                    className={
                                      record.paymentStatus === "paid"
                                        ? "bg-green-700 text-white text-xs"
                                        : "bg-gray-700 text-gray-300 text-xs"
                                    }
                                  >
                                    {record.paymentStatus === "paid" ? "Төлсөн" : "Төлөөгүй"}
                                  </Badge>
                                  {record.paymentStatus !== "paid" && (
                                    <Button
                                      size="xs" // Changed to xs for smaller button
                                      variant="outline"
                                      onClick={() => handlePaymentStatusUpdate(record)}
                                      className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 text-xs"
                                    >
                                      Төлбөр
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-700 px-1 py-0.5">
                                {record.images && record.images.length > 0 ? (
                                  <Button
                                    size="xs" // Changed to xs for smaller button
                                    variant="outline"
                                    onClick={() => openImageViewer(record.images, 0)}
                                    className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-0.5" /> {/* Smaller icon */}
                                    {record.images.length}
                                  </Button>
                                ) : (
                                  <span className="text-gray-500 text-xs">Байхгүй</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Employee Dialog */}
        <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Ажилчин нэмэх</DialogTitle>
              <DialogDescription className="text-gray-400">Шинэ ажилчны мэдээллийг оруулна уу</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label htmlFor="employeeName" className="text-gray-300">
                  Нэр *
                </Label>
                <Input
                  id="employeeName"
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Ажилчны нэр"
                  required
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="employeePosition" className="text-gray-300">
                  Албан тушаал
                </Label>
                <Input
                  id="employeePosition"
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  placeholder="Албан тушаал"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="employeePhone" className="text-gray-300">
                  Утасны дугаар
                </Label>
                <Input
                  id="employeePhone"
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="99112233"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="employeeStartDate" className="text-gray-300">
                  Ажилд орсон огноо
                </Label>
                <Input
                  id="employeeStartDate"
                  type="date"
                  value={newEmployee.startDate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="employeeImage" className="text-gray-300">
                  Зураг
                </Label>
                <Input
                  id="employeeImage"
                  type="file"
                  accept="image/*"
                  onChange={handleEmployeeImageUpload}
                  className="bg-gray-800 text-white border-gray-700"
                />
                {newEmployee.profileImage && (
                  <div className="mt-2">
                    <img
                      src={newEmployee.profileImage || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmployeeDialog(false)}
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                >
                  Цуцлах
                </Button>
                <Button type="submit" disabled={employeeLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                  {employeeLoading ? "Нэмж байна..." : "Нэмэх"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog (for drivers, managers, directors, and employees) */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingDriver?.role === "manager"
                  ? "Менежер"
                  : editingDriver?.role === "driver"
                    ? "Бүртгэгч"
                    : editingDriver?.role === "director"
                      ? "Захирал"
                      : "Ажилчин"}{" "}
                засах
              </DialogTitle>
              <DialogDescription className="text-gray-400">Мэдээллийг шинэчлэх</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName" className="text-gray-300">
                  Нэр
                </Label>
                <Input
                  id="editName"
                  type="text"
                  value={editDriverData.name}
                  onChange={(e) => setEditDriverData({ ...editDriverData, name: e.target.value })}
                  placeholder="Нэр"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editPhone" className="text-gray-300">
                  Утасны дугаар
                </Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editDriverData.phone}
                  onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                  placeholder="Утасны дугаар"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editEmail" className="text-gray-300">
                  И-мэйл хаяг
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editDriverData.email}
                  onChange={(e) => setEditDriverData({ ...editDriverData, email: e.target.value })}
                  placeholder="И-мэйл хаяг"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button
                onClick={editingEmployee ? handleSaveEmployeeEdit : handleSaveDriverEdit}
                disabled={editLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {editLoading ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-white">Профайл засах</DialogTitle>
              <DialogDescription className="text-gray-400">Өөрийн мэдээллийг шинэчлэх</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profileName" className="text-gray-300">
                  Нэр
                </Label>
                <Input
                  id="profileName"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Нэр"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="profilePhone" className="text-gray-300">
                  Утасны дугаар
                </Label>
                <Input
                  id="profilePhone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Утасны дугаар"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="profileEmail" className="text-gray-300">
                  И-мэйл хаяг
                </Label>
                <Input
                  id="profileEmail"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="И-мэйл хаяг"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="profileImage" className="text-gray-300">
                  Профайл зураг
                </Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "profile")}
                  className="bg-gray-800 text-white border-gray-700"
                />
                {profileData.profileImage && (
                  <div className="mt-2">
                    <img
                      src={profileData.profileImage || "/placeholder.svg"}
                      alt="Profile Preview"
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-medium mb-2 text-white">Нууц үг солих</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword" className="text-gray-300">
                      Одоогийн нууц үг
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Одоогийн нууц үг"
                        className="bg-gray-800 text-white border-gray-700"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-gray-300">
                      Шинэ нууц үг
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Шинэ нууц үг"
                      className="bg-gray-800 text-white border-gray-700"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-300">
                      Шинэ нууц үг давтах
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Шинэ нууц үг давтах"
                        className="bg-gray-800 text-white border-gray-700"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {profileLoading ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Status Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Төлбөрийн мэдээлэл</DialogTitle>
              <DialogDescription className="text-gray-400">Төлбөрийн дүн болон хэлбэрийг оруулна уу</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cashAmount" className="text-gray-300">
                  Бэлэн мөнгө (₮)
                </Label>
                <Input
                  id="cashAmount"
                  type="number"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(Number(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="cardAmount" className="text-gray-300">
                  Карт (₮)
                </Label>
                <Input
                  id="cardAmount"
                  type="number"
                  value={cardAmountInput}
                  onChange={(e) => setCardAmountInput(Number(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="transferAmount" className="text-gray-300">
                  Харилцах (₮)
                </Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={transferAmountInput}
                  onChange={(e) => setTransferAmountInput(Number(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div className="bg-gray-800 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Төлөх дүн:</span>
                  <span className="text-lg font-bold text-white">
                    ₮{(initialAmountToPay - (cashAmountInput + cardAmountInput + transferAmountInput)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Нийт дүн:</span>
                  <span className="text-lg font-bold text-white">
                    ₮{(cashAmountInput + cardAmountInput + transferAmountInput).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleSavePaymentStatus}
                disabled={paymentLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {paymentLoading ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Date Range Export Dialog */}
        <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Огнооны хүрээгээр татах</DialogTitle>
              <DialogDescription className="text-gray-400">
                Тодорхой хугацааны бүртгэлийг Excel файлаар татах
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateRangeStart" className="text-gray-300">
                  Эхлэх огноо
                </Label>
                <Input
                  id="dateRangeStart"
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="dateRangeEnd" className="text-gray-300">
                  Дуусах огноо
                </Label>
                <Input
                  id="dateRangeEnd"
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deleteAfterExport"
                  checked={deleteAfterExport}
                  onCheckedChange={(checked) => setDeleteAfterExport(checked as boolean)}
                  className="border-gray-700 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                />
                <Label htmlFor="deleteAfterExport" className="text-sm text-gray-300">
                  Татсаны дараа бүртгэлийг устгах
                </Label>
              </div>

              {deleteAfterExport && (
                <div className="bg-red-950 border border-red-700 rounded-md p-3">
                  <p className="text-sm text-red-300">
                    <strong>Анхааруулга:</strong> Энэ үйлдэл нь сонгосон хугацааны бүх бүртгэлийг өгөгдлийн сангаас
                    бүрмөсөн устгана. Энэ үйлдлийг буцаах боломжгүй.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDateRangeDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleDateRangeExport}
                disabled={exportLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {exportLoading ? "Татаж байна..." : "Татах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        <Dialog open={showEditRecordDialog} onOpenChange={setShowEditRecordDialog}>
          <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Бүртгэл засах</DialogTitle>
              <DialogDescription className="text-gray-400">Бүртгэлийн мэдээллийг шинэчлэх</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCarNumber" className="text-gray-300">
                  Машины дугаар
                </Label>
                <Input
                  id="editCarNumber"
                  type="text"
                  value={editRecordData.carNumber}
                  onChange={(e) => setEditRecordData({ ...editRecordData, carNumber: e.target.value })}
                  placeholder="Машины дугаар"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editMechanicName" className="text-gray-300">
                  Засварчин
                </Label>
                <Input
                  id="editMechanicName"
                  type="text"
                  value={editRecordData.mechanicName}
                  onChange={(e) => setEditRecordData({ ...editRecordData, mechanicName: e.target.value })}
                  placeholder="Засварчны нэр"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editCarBrand" className="text-gray-300">
                  Машины марк
                </Label>
                <Input
                  id="editCarBrand"
                  type="text"
                  value={editRecordData.carBrand}
                  onChange={(e) => setEditRecordData({ ...editRecordData, carBrand: e.target.value })}
                  placeholder="Машины марк"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editEntryTime" className="text-gray-300">
                  Орсон цаг
                </Label>
                <Input
                  id="editEntryTime"
                  type="text"
                  value={editRecordData.entryTime}
                  onChange={(e) => setEditRecordData({ ...editRecordData, entryTime: e.target.value })}
                  placeholder="2024.01.15, 14:30"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editExitTime" className="text-gray-300">
                  Гарсан цаг
                </Label>
                <Input
                  id="editExitTime"
                  type="text"
                  value={editRecordData.exitTime}
                  onChange={(e) => setEditRecordData({ ...editRecordData, exitTime: e.target.value })}
                  placeholder="2024.01.15, 16:30"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editParkingDuration" className="text-gray-300">
                  Зогссон хугацаа
                </Label>
                <Input
                  id="editParkingDuration"
                  type="text"
                  value={editRecordData.parkingDuration}
                  onChange={(e) => setEditRecordData({ ...editRecordData, parkingDuration: e.target.value })}
                  placeholder="2 цаг"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="editNotes" className="text-gray-300">
                  Тэмдэглэл
                </Label>
                <Input
                  id="editNotes"
                  type="text"
                  value={editRecordData.notes}
                  onChange={(e) => setEditRecordData({ ...editRecordData, notes: e.target.value })}
                  placeholder="Нэмэлт тэмдэглэл"
                  className="bg-gray-800 text-white border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditRecordDialog(false)}
                className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              >
                Цуцлах
              </Button>
              <Button
                onClick={handleSaveRecordEdit}
                disabled={editRecordLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {editRecordLoading ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Modal */}
        {showImageViewer && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-full p-4">
              <button onClick={closeImageViewer} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}

              <img
                src={currentImages[currentImageIndex] || "/placeholder.svg"}
                alt={`Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
                  {currentImageIndex + 1} / {currentImages.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
