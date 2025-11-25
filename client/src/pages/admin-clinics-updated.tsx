// NOTE: This file shows the additions needed to admin-clinics.tsx
// Add after the existing clinic card rendering, before CardContent closing:
// 
// {clinic.ownerVerificationCode && (
//   <Button
//     variant="ghost"
//     size="sm"
//     onClick={() => copyEditLink(clinic)}
//     className="text-sm"
//   >
//     {copiedClinicId === clinic.id ? (
//       <>
//         <CheckIcon className="h-4 w-4 mr-1" />
//         Copied!
//       </>
//     ) : (
//       <>
//         <Copy className="h-4 w-4 mr-1" />
//         Copy Link
//       </>
//     )}
//   </Button>
// )}
