import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CartolaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "leader" | "vice" | "lanterna";
}

const CartolaCard = React.forwardRef<HTMLDivElement, CartolaCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-card text-card-foreground",
      highlight: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
      leader: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300",
      vice: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300",
      lanterna: "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
CartolaCard.displayName = "CartolaCard";

interface TeamCardProps {
  teamName: string;
  ownerName: string;
  position?: number;
  points?: number;
  avatar?: string;
  variant?: "leader" | "vice" | "lanterna" | "default";
  badge?: string;
}

const TeamCard = React.forwardRef<HTMLDivElement, TeamCardProps>(
  ({ teamName, ownerName, position, points, avatar, variant = "default", badge, ...props }, ref) => {
    const getBadgeVariant = () => {
      switch (variant) {
        case "leader":
          return "bg-yellow-500 text-white";
        case "vice":
          return "bg-gray-500 text-white";
        case "lanterna":
          return "bg-red-500 text-white";
        default:
          return "bg-primary text-primary-foreground";
      }
    };

    const getPositionIcon = () => {
      switch (variant) {
        case "leader":
          return "🏆";
        case "vice":
          return "🥈";
        case "lanterna":
          return "🔻";
        default:
          return null;
      }
    };

    return (
      <CartolaCard ref={ref} variant={variant} className="p-6" {...props}>
        <CardContent className="p-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={avatar} alt={ownerName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {ownerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {position && (
                <Badge className={cn("absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs", getBadgeVariant())}>
                  {position}
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {getPositionIcon() && (
                  <span className="text-lg">{getPositionIcon()}</span>
                )}
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {teamName}
                </h3>
              </div>
              <p className="text-xs text-gray-600 truncate">{ownerName}</p>
              {points !== undefined && (
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {points.toFixed(2)} pts
                </p>
              )}
            </div>

            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </CardContent>
      </CartolaCard>
    );
  }
);
TeamCard.displayName = "TeamCard";

interface LeagueCardProps {
  leagueName: string;
  participants: number;
  status: "open" | "closed" | "finished";
  prize?: string;
  description?: string;
  image?: string;
}

const LeagueCard = React.forwardRef<HTMLDivElement, LeagueCardProps>(
  ({ leagueName, participants, status, prize, description, image, ...props }, ref) => {
    const getStatusBadge = () => {
      switch (status) {
        case "open":
          return <Badge className="bg-green-500 text-white">Aberta</Badge>;
        case "closed":
          return <Badge className="bg-orange-500 text-white">Em Andamento</Badge>;
        case "finished":
          return <Badge className="bg-muted text-muted-foreground">Finalizada</Badge>;
      }
    };

    return (
      <CartolaCard ref={ref} className="overflow-hidden" {...props}>
        {image && (
          <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-bold text-lg">{leagueName}</h3>
            </div>
          </div>
        )}
        
        <CardContent className="p-6">
          {!image && (
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{leagueName}</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
          )}
          
          {description && (
            <CardDescription className="mb-4">
              {description}
            </CardDescription>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{participants.toLocaleString()} participantes</span>
            {prize && <span className="font-medium text-primary">{prize}</span>}
          </div>
        </CardContent>
      </CartolaCard>
    );
  }
);
LeagueCard.displayName = "LeagueCard";

export { CartolaCard, TeamCard, LeagueCard };
export type { CartolaCardProps, TeamCardProps, LeagueCardProps };